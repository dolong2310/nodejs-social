/*
 * Post Repository
 * This file contains the PostRepository class which implements IPostRepository interface.
 * It provides methods to interact with the post data in the database.
 */

import { Injectable } from '@/decorators/injectable.decorator';
import { DateIdCursor } from '@/interfaces/types/cursor.type';
import { BaseRepository } from '@/modules/base/base.repository';
import { CreatePostRequestDTO } from '@/modules/posts/dtos/posts.request.dto';
import { PostDetailResponseDTO, PostNewFeedResponseDTO } from '@/modules/posts/dtos/posts.response.dto';
import { EPostAudience, EPostType } from '@/modules/posts/posts.enum';
import { IPost, PostSchema } from '@/modules/posts/posts.schema';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { HashtagSchema, IHashtag } from '@/shared/models/hashtag.schema';
import { buildBasePostPipeline } from '@/utils/posts.pipeline.util';
import { AnyBulkWriteOperation, FindOneAndUpdateOptions, ObjectId, UpdateResult } from 'mongodb';

export interface IPostRepository {
  findById(id: string): Promise<PostDetailResponseDTO>;
  /**
   * True if viewer has post-level engagement: like, bookmark, or a COMMENT child on this post.
   * Used for BLCK-02 / D-11 (blocked pair + prior engagement → content visible, author redacted).
   */
  hasViewerEngagedWithPost(viewerId: string, postId: string): Promise<boolean>;
  /**
   * Post ids whose author is in `authorIds` and where `viewerId` has engaged (like, bookmark, or comment on that post).
   */
  findPostIdsWhereViewerEngagedWithAuthors(viewerId: string, authorIds: string[]): Promise<string[]>;
  findPosts(payload: {
    userId: string;
    friendUserIds: string[];
    blockedAuthorIds: string[];
    /** Extra posts to include (e.g. engaged-with-blocked-author); visibility still enforced by caller context. */
    extraVisiblePostIds?: string[];
    cursor?: DateIdCursor;
    limit: number;
  }): Promise<PostNewFeedResponseDTO[]>;
  findGuestPosts(payload: { cursor?: DateIdCursor; limit: number }): Promise<PostNewFeedResponseDTO[]>;
  countPosts(payload: {
    userId: string;
    friendUserIds: string[];
    blockedAuthorIds: string[];
    extraVisiblePostIds?: string[];
  }): Promise<number>;
  countGuestPosts(): Promise<number>;
  findPostsType(payload: {
    cursor?: DateIdCursor;
    limit: number;
    postId: string;
    type: EPostType;
  }): Promise<PostDetailResponseDTO[]>;
  countPostsType(payload: { postId: string; type: EPostType }): Promise<number>;
  findPostById(postId: string): Promise<IPost | null>;
  findOneAndUpdate(
    payload: { postId: string; userId?: string },
    options?: FindOneAndUpdateOptions
  ): Promise<IPost | null>;
  createPost(payload: {
    userId: string;
    body: Omit<CreatePostRequestDTO, 'hashtags'> & { hashtags: ObjectId[] };
  }): Promise<IPost>;
  updatePostAudienceAndStrangerComments(
    postId: string,
    ownerUserId: string,
    patch: { audience: EPostAudience; allowStrangerComments: boolean }
  ): Promise<IPost | null>;
  updatePosts(payload: {
    posts: PostDetailResponseDTO[] | PostNewFeedResponseDTO[];
    userId?: string;
    date: Date;
  }): Promise<UpdateResult<IPost>>;
  incrementViewsByIds(postIds: string[], isAuthenticatedViewer: boolean): Promise<number>;
  findAndUpsertHashtags(hashtags: string[]): Promise<(IHashtag | null)[]>;
}

@Injectable()
export class PostRepository extends BaseRepository implements IPostRepository {
  constructor(readonly db: DatabaseService) {
    super(db);
  }

  async hasViewerEngagedWithPost(viewerId: string, postId: string): Promise<boolean> {
    const v = new ObjectId(viewerId);
    const p = new ObjectId(postId);
    const [like, bookmark, comment] = await Promise.all([
      // Tìm like của viewer với post (likes.findOne)
      this.db.likes.findOne({ userId: v, postId: p }, { projection: { _id: 1 } }),
      // Tìm bookmark của viewer với post (bookmarks.findOne)
      this.db.bookmarks.findOne({ userId: v, postId: p }, { projection: { _id: 1 } }),
      // Tìm comment mà viewer comment vào post đó (posts.findOne với parentId = postId và type = COMMENT)
      this.db.posts.findOne({ userId: v, parentId: p, type: EPostType.COMMENT }, { projection: { _id: 1 } })
    ]);
    // Nếu có ít nhất 1 trong 3 loại tương tác thì trả true
    return like !== null || bookmark !== null || comment !== null;
  }

  async findPostIdsWhereViewerEngagedWithAuthors(viewerId: string, authorIds: string[]): Promise<string[]> {
    if (authorIds.length === 0) {
      return [];
    }

    const viewerOid = new ObjectId(viewerId);
    const authorOids = authorIds.map((id) => new ObjectId(id));

    const [fromLikes, fromBookmarks, fromComments] = await Promise.all([
      this.db.likes
        .aggregate<{ _id: ObjectId }>([
          { $match: { userId: viewerOid } },
          {
            $lookup: {
              from: 'posts',
              localField: 'postId',
              foreignField: '_id',
              as: 'post'
            }
          },
          { $unwind: '$post' },
          { $match: { 'post.userId': { $in: authorOids } } },
          { $group: { _id: '$postId' } }
        ])
        .toArray(),
      this.db.bookmarks
        .aggregate<{ _id: ObjectId }>([
          { $match: { userId: viewerOid } },
          {
            $lookup: {
              from: 'posts',
              localField: 'postId',
              foreignField: '_id',
              as: 'post'
            }
          },
          { $unwind: '$post' },
          { $match: { 'post.userId': { $in: authorOids } } },
          { $group: { _id: '$postId' } }
        ])
        .toArray(),
      this.db.posts
        .aggregate<{ _id: ObjectId }>([
          {
            $match: {
              userId: viewerOid,
              type: EPostType.COMMENT,
              parentId: { $ne: null }
            }
          },
          {
            $lookup: {
              from: 'posts',
              localField: 'parentId',
              foreignField: '_id',
              as: 'parent'
            }
          },
          { $unwind: '$parent' },
          { $match: { 'parent.userId': { $in: authorOids } } },
          { $group: { _id: '$parentId' } }
        ])
        .toArray()
    ]);

    const seen = new Set<string>();
    const out: string[] = [];
    for (const row of [...fromLikes, ...fromBookmarks, ...fromComments]) {
      const id = row._id;
      const k = id.toHexString();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(k);
      }
    }
    return out;
  }

  async findById(id: string): Promise<PostDetailResponseDTO> {
    const pipelineGetDetailPost = [
      {
        $match: {
          _id: new ObjectId(id)
        }
      },
      {
        $addFields: {
          allowStrangerComments: { $ifNull: ['$allowStrangerComments', true] }
        }
      },
      {
        $lookup: {
          from: 'hashtags',
          localField: 'hashtags',
          foreignField: '_id',
          as: 'hashtags'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'mentions',
          foreignField: '_id',
          as: 'mentions'
        }
      },
      {
        $addFields: {
          mentions: {
            $map: {
              input: '$mentions',
              as: 'mention',
              in: {
                _id: '$$mention._id',
                name: '$$mention.name',
                email: '$$mention.email',
                username: '$$mention.username',
                verificationStatus: '$$mention.verificationStatus'
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'bookmarks',
          localField: '_id',
          foreignField: 'postId',
          pipeline: [
            {
              $project: {
                _id: 1
              }
            }
          ],
          as: 'bookmarks'
        }
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'parentId',
          as: 'post_child'
        }
      },
      {
        $addFields: {
          bookmarkCount: {
            $size: '$bookmarks'
          },
          repostCount: {
            $size: {
              $filter: {
                input: '$post_child',
                as: 'item',
                cond: {
                  $eq: ['$$item.type', EPostType.REPOST]
                }
              }
            }
          },
          commentCount: {
            $size: {
              $filter: {
                input: '$post_child',
                as: 'item',
                cond: {
                  $eq: ['$$item.type', EPostType.COMMENT]
                }
              }
            }
          },
          quoteCount: {
            $size: {
              $filter: {
                input: '$post_child',
                as: 'item',
                cond: {
                  $eq: ['$$item.type', EPostType.QUOTE]
                }
              }
            }
          }
          // totalViews: {
          //   $add: ['$userViews', '$guestViews']
          // }
        }
      },
      {
        $project: {
          bookmarks: 0,
          post_child: 0
        }
      }
    ];
    const [post] = await this.db.posts.aggregate<PostDetailResponseDTO>(pipelineGetDetailPost).toArray();

    return post;
  }

  async findPosts({
    userId,
    friendUserIds,
    blockedAuthorIds,
    extraVisiblePostIds,
    cursor,
    limit
  }: {
    userId: string;
    friendUserIds: string[];
    blockedAuthorIds: string[];
    extraVisiblePostIds?: string[];
    cursor?: DateIdCursor;
    limit: number;
  }): Promise<PostNewFeedResponseDTO[]> {
    const viewerOid = new ObjectId(userId);
    const blocked = blockedAuthorIds.filter((id) => id !== userId).map((id) => new ObjectId(id));
    const friendIds = friendUserIds.filter((id) => id !== userId).map((id) => new ObjectId(id));

    const match = this.buildFeedMatch({
      viewerOid,
      blocked,
      friendIds,
      extraVisiblePostIds,
      cursor
    });

    const pipelineGetNewFeeds = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: true
    });

    return this.db.posts.aggregate<PostNewFeedResponseDTO>(pipelineGetNewFeeds).toArray();
  }

  async countPosts({
    userId,
    friendUserIds,
    blockedAuthorIds,
    extraVisiblePostIds
  }: {
    userId: string;
    friendUserIds: string[];
    blockedAuthorIds: string[];
    extraVisiblePostIds?: string[];
  }): Promise<number> {
    const viewerOid = new ObjectId(userId);
    const blocked = blockedAuthorIds.filter((id) => id !== userId).map((id) => new ObjectId(id));
    const friendIds = friendUserIds.filter((id) => id !== userId).map((id) => new ObjectId(id));

    const orBranches: Record<string, unknown>[] = [
      {
        audience: EPostAudience.PUBLIC,
        userId: { $nin: blocked }
      },
      { userId: viewerOid },
      {
        audience: EPostAudience.FRIENDS_ONLY,
        userId: { $in: friendIds, $nin: blocked }
      }
    ];
    if (extraVisiblePostIds && extraVisiblePostIds.length > 0) {
      orBranches.push({ _id: { $in: extraVisiblePostIds.map((id) => new ObjectId(id)) } });
    }
    const match: Record<string, unknown> = { $or: orBranches };

    return this.count(this.db.posts, match);
  }

  async findGuestPosts({ cursor, limit }: { cursor?: DateIdCursor; limit: number }): Promise<PostNewFeedResponseDTO[]> {
    const match: Record<string, unknown> = {
      audience: EPostAudience.PUBLIC
    };
    if (cursor) {
      const cursorId = new ObjectId(cursor._id);
      match.$or = [{ createdAt: { $lt: cursor.createdAt } }, { createdAt: cursor.createdAt, _id: { $lt: cursorId } }];
    }

    const pipelineGetGuestNewFeeds = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: true
    });

    return this.db.posts.aggregate<PostNewFeedResponseDTO>(pipelineGetGuestNewFeeds).toArray();
  }

  async countGuestPosts(): Promise<number> {
    const match = {
      audience: EPostAudience.PUBLIC
    };

    const totalPosts = await this.count(this.db.posts, match);
    return totalPosts;
  }

  async findPostsType({
    cursor,
    limit,
    postId,
    type
  }: {
    cursor?: DateIdCursor;
    limit: number;
    postId: string;
    type: EPostType;
  }): Promise<PostDetailResponseDTO[]> {
    const match: Record<string, unknown> = {
      parentId: new ObjectId(postId),
      type
    };
    if (cursor) {
      const cursorId = new ObjectId(cursor._id);
      match.$or = [{ createdAt: { $lt: cursor.createdAt } }, { createdAt: cursor.createdAt, _id: { $lt: cursorId } }];
    }

    const pipelineGetPostsType = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: false
    });

    const posts = await this.db.posts.aggregate<PostDetailResponseDTO>(pipelineGetPostsType).toArray();
    return posts;
  }

  async countPostsType({ postId, type }: { postId: string; type: EPostType }): Promise<number> {
    const match = {
      parentId: new ObjectId(postId),
      type
    };
    const totalPosts = await this.count(this.db.posts, match);
    return totalPosts;
  }

  findPostById(postId: string): Promise<IPost | null> {
    return this.db.posts.findOne({ _id: new ObjectId(postId) });
  }

  findOneAndUpdate(
    { postId, userId }: { postId: string; userId?: string },
    options?: FindOneAndUpdateOptions
  ): Promise<IPost | null> {
    return this.db.posts.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $inc: userId ? { userViews: 1 } : { guestViews: 1 }, $currentDate: { updatedAt: true } },
      options ?? {}
    );
  }

  async createPost({
    userId,
    body
  }: {
    userId: string;
    body: Omit<CreatePostRequestDTO, 'hashtags'> & { hashtags: ObjectId[] };
  }): Promise<IPost> {
    const { type, audience, allowStrangerComments, content, parentId, hashtags, mentions, media } = body;

    const newPost = new PostSchema({
      userId: new ObjectId(userId),
      type,
      audience,
      allowStrangerComments,
      content,
      parentId: parentId ? new ObjectId(parentId) : null,
      hashtags,
      mentions: mentions.map((mention) => new ObjectId(mention)),
      media,
      guestViews: 0,
      userViews: 0
    });
    await this.db.posts.insertOne(newPost);

    return newPost;
  }

  async updatePostAudienceAndStrangerComments(
    postId: string,
    ownerUserId: string,
    patch: { audience: EPostAudience; allowStrangerComments: boolean }
  ): Promise<IPost | null> {
    const updated = await this.db.posts.findOneAndUpdate(
      { _id: new ObjectId(postId), userId: new ObjectId(ownerUserId) },
      {
        $set: {
          audience: patch.audience,
          allowStrangerComments: patch.allowStrangerComments,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    return updated;
  }

  updatePosts({
    posts,
    userId,
    date
  }: {
    posts: PostDetailResponseDTO[] | PostNewFeedResponseDTO[];
    userId?: string;
    date: Date;
  }): Promise<UpdateResult<IPost>> {
    return this.db.posts.updateMany(
      { _id: { $in: posts.map((post) => post._id) } },
      {
        $inc: userId ? { userViews: 1 } : { guestViews: 1 },
        $set: { updatedAt: date }
      }
    );
  }

  async incrementViewsByIds(postIds: string[], isAuthenticatedViewer: boolean): Promise<number> {
    if (postIds.length === 0) {
      return 0;
    }
    const ids = postIds.map((id) => new ObjectId(id));
    const res = await this.db.posts.updateMany(
      { _id: { $in: ids } },
      {
        $inc: isAuthenticatedViewer ? { userViews: 1 } : { guestViews: 1 },
        $currentDate: { updatedAt: true }
      }
    );
    return res.modifiedCount;
  }

  async findAndUpsertHashtags(hashtags: string[]): Promise<(IHashtag | null)[]> {
    if (hashtags.length === 0) return [];

    const now = new Date();
    const ops: AnyBulkWriteOperation<IHashtag>[] = hashtags.map((name) => ({
      updateOne: {
        filter: { name },
        update: { $setOnInsert: new HashtagSchema({ name, createdAt: now }) },
        upsert: true
      }
    }));

    // Thực hiện bulkWrite để upsert (chèn mới hoặc cập nhật) nhiều hashtag cùng lúc.
    // option { ordered: false } cho phép các thao tác upsert diễn ra song song, không dừng lại khi có 1 thao tác bị lỗi (ví dụ trùng key),
    // Điều này giúp tối ưu hiệu suất khi insert nhiều hashtag cùng lúc và không bị ảnh hưởng nếu có hashtag đã tồn tại.
    // Tránh loop find one and update vì N + 1 query (nhiều round-trip).
    await this.db.hashtags.bulkWrite(ops, { ordered: false });

    return this.db.hashtags.find({ name: { $in: hashtags } }, { projection: { _id: 1, name: 1 } }).toArray();
  }

  private buildFeedMatch({
    viewerOid,
    blocked,
    friendIds,
    extraVisiblePostIds,
    cursor
  }: {
    viewerOid: ObjectId;
    blocked: ObjectId[];
    friendIds: ObjectId[];
    extraVisiblePostIds?: string[];
    cursor?: DateIdCursor;
  }): Record<string, unknown> {
    const orBranches: Record<string, unknown>[] = [
      {
        audience: EPostAudience.PUBLIC,
        userId: { $nin: blocked }
      },
      { userId: viewerOid },
      {
        audience: EPostAudience.FRIENDS_ONLY,
        userId: { $in: friendIds, $nin: blocked }
      }
    ];
    if (extraVisiblePostIds && extraVisiblePostIds.length > 0) {
      orBranches.push({ _id: { $in: extraVisiblePostIds.map((id) => new ObjectId(id)) } });
    }

    const base: Record<string, unknown> = { $or: orBranches };
    if (!cursor) {
      return base;
    }
    const cursorId = new ObjectId(cursor._id);
    return {
      $and: [
        base,
        {
          $or: [{ createdAt: { $lt: cursor.createdAt } }, { createdAt: cursor.createdAt, _id: { $lt: cursorId } }]
        }
      ]
    };
  }
}
