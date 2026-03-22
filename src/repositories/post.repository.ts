/*
 * Post Repository
 * This file contains the PostRepository class which implements IPostRepository interface.
 * It provides methods to interact with the post data in the database.
 */

import DatabaseService from '@/database/mongodb/database.service';
import { CreatePostRequestDTO } from '@/dtos/requests/post.request.dto';
import { PostDetailResponseDTO, PostNewFeedResponseDTO } from '@/dtos/responses/post.response.dto';
import { EPostAudience, EPostType } from '@/enums/posts.enum';
import HashtagSchema, { IHashtag } from '@/models/schemas/hashtag.schema';
import PostSchema, { IPost } from '@/models/schemas/post.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { buildBasePostPipeline } from '@/utils/posts.pipeline.util';
import { AnyBulkWriteOperation, FindOneAndUpdateOptions, ObjectId, UpdateResult } from 'mongodb';

export interface IPostRepository {
  findById(id: string): Promise<PostDetailResponseDTO>;
  /**
   * True if viewer has post-level engagement: like, bookmark, or a COMMENT child on this post.
   * Used for BLCK-02 / D-11 (blocked pair + prior engagement → content visible, author redacted).
   */
  hasViewerEngagedWithPost(viewerId: ObjectId, postId: ObjectId): Promise<boolean>;
  /**
   * Post ids whose author is in `authorIds` and where `viewerId` has engaged (like, bookmark, or comment on that post).
   */
  findPostIdsWhereViewerEngagedWithAuthors(viewerId: ObjectId, authorIds: ObjectId[]): Promise<ObjectId[]>;
  findPosts(payload: {
    userId: string;
    followedUserIds: ObjectId[];
    blockedAuthorIds: ObjectId[];
    /** Extra posts to include (e.g. engaged-with-blocked-author); visibility still enforced by caller context. */
    extraVisiblePostIds?: ObjectId[];
    page: number;
    limit: number;
  }): Promise<PostNewFeedResponseDTO[]>;
  countPosts(payload: {
    userId: string;
    followedUserIds: ObjectId[];
    blockedAuthorIds: ObjectId[];
    extraVisiblePostIds?: ObjectId[];
  }): Promise<number>;
  findGuestPosts(payload: { page: number; limit: number }): Promise<PostNewFeedResponseDTO[]>;
  countGuestPosts(): Promise<number>;
  findPostsType(payload: {
    page: number;
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
  findAndUpsertHashtags(hashtags: string[]): Promise<(IHashtag | null)[]>;
}

export class PostRepository extends BaseRepository implements IPostRepository {
  constructor(readonly db: DatabaseService) {
    super(db);
  }

  async hasViewerEngagedWithPost(viewerId: ObjectId, postId: ObjectId): Promise<boolean> {
    const [like, bookmark, comment] = await Promise.all([
      this.db.likes.findOne({ userId: viewerId, postId }, { projection: { _id: 1 } }),
      this.db.bookmarks.findOne({ userId: viewerId, postId }, { projection: { _id: 1 } }),
      this.db.posts.findOne(
        { userId: viewerId, parentId: postId, type: EPostType.COMMENT },
        { projection: { _id: 1 } }
      )
    ]);
    return like !== null || bookmark !== null || comment !== null;
  }

  async findPostIdsWhereViewerEngagedWithAuthors(
    viewerId: ObjectId,
    authorIds: ObjectId[]
  ): Promise<ObjectId[]> {
    if (authorIds.length === 0) {
      return [];
    }

    const [fromLikes, fromBookmarks, fromComments] = await Promise.all([
      this.db.likes
        .aggregate<{ _id: ObjectId }>([
          { $match: { userId: viewerId } },
          {
            $lookup: {
              from: 'posts',
              localField: 'postId',
              foreignField: '_id',
              as: 'post'
            }
          },
          { $unwind: '$post' },
          { $match: { 'post.userId': { $in: authorIds } } },
          { $group: { _id: '$postId' } }
        ])
        .toArray(),
      this.db.bookmarks
        .aggregate<{ _id: ObjectId }>([
          { $match: { userId: viewerId } },
          {
            $lookup: {
              from: 'posts',
              localField: 'postId',
              foreignField: '_id',
              as: 'post'
            }
          },
          { $unwind: '$post' },
          { $match: { 'post.userId': { $in: authorIds } } },
          { $group: { _id: '$postId' } }
        ])
        .toArray(),
      this.db.posts
        .aggregate<{ _id: ObjectId }>([
          {
            $match: {
              userId: viewerId,
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
          { $match: { 'parent.userId': { $in: authorIds } } },
          { $group: { _id: '$parentId' } }
        ])
        .toArray()
    ]);

    const seen = new Set<string>();
    const out: ObjectId[] = [];
    for (const row of [...fromLikes, ...fromBookmarks, ...fromComments]) {
      const id = row._id;
      const k = id.toHexString();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(id);
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
    followedUserIds,
    blockedAuthorIds,
    extraVisiblePostIds,
    page,
    limit
  }: {
    userId: string;
    followedUserIds: ObjectId[];
    blockedAuthorIds: ObjectId[];
    extraVisiblePostIds?: ObjectId[];
    page: number;
    limit: number;
  }): Promise<PostNewFeedResponseDTO[]> {
    const viewerOid = new ObjectId(userId);
    const blocked = blockedAuthorIds.filter((id) => !id.equals(viewerOid));
    const friendIds = followedUserIds.filter((id) => !id.equals(viewerOid));

    /**
     * Authenticated home feed (FEED-01, FEED-02, BLCK-02):
     * - All eligible `public` posts (any author except blocked), plus
     * - Viewer’s own posts (any audience), plus
     * - Mutual friends’ `friends-only` posts (authors in friendIds, not blocked).
     * - Plus posts the viewer engaged with whose author is blocked (D-11) — author redacted in service layer.
     */
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
      orBranches.push({ _id: { $in: extraVisiblePostIds } });
    }
    const match: Record<string, unknown> = { $or: orBranches };

    const pipelineGetNewFeeds = buildBasePostPipeline({
      match,
      skip: limit * (page - 1),
      limit,
      includeAuthor: true
    });

    const posts = await this.db.posts.aggregate<PostNewFeedResponseDTO>(pipelineGetNewFeeds).toArray();
    return posts;
  }

  async countPosts({
    userId,
    followedUserIds,
    blockedAuthorIds,
    extraVisiblePostIds
  }: {
    userId: string;
    followedUserIds: ObjectId[];
    blockedAuthorIds: ObjectId[];
    extraVisiblePostIds?: ObjectId[];
  }): Promise<number> {
    const viewerOid = new ObjectId(userId);
    const blocked = blockedAuthorIds.filter((id) => !id.equals(viewerOid));
    const friendIds = followedUserIds.filter((id) => !id.equals(viewerOid));

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
      orBranches.push({ _id: { $in: extraVisiblePostIds } });
    }
    const match: Record<string, unknown> = { $or: orBranches };

    return this.count(this.db.posts, match);
  }

  async findGuestPosts({ page, limit }: { page: number; limit: number }): Promise<PostNewFeedResponseDTO[]> {
    const match = {
      audience: EPostAudience.PUBLIC
    };

    const pipelineGetGuestNewFeeds = buildBasePostPipeline({
      match,
      skip: limit * (page - 1),
      limit,
      includeAuthor: true
    });

    const posts = await this.db.posts.aggregate<PostNewFeedResponseDTO>(pipelineGetGuestNewFeeds).toArray();
    return posts;
  }

  async countGuestPosts(): Promise<number> {
    const match = {
      audience: EPostAudience.PUBLIC
    };

    const totalPosts = await this.count(this.db.posts, match);
    return totalPosts;
  }

  async findPostsType({
    page,
    limit,
    postId,
    type
  }: {
    page: number;
    limit: number;
    postId: string;
    type: EPostType;
  }): Promise<PostDetailResponseDTO[]> {
    const match = {
      parentId: new ObjectId(postId),
      type
    };

    const pipelineGetPostsType = buildBasePostPipeline({
      match,
      skip: limit * (page - 1),
      limit,
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

    return this.db.hashtags.find({ name: { $in: hashtags } }).toArray();
  }
}
