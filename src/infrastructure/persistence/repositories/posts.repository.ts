import { HashtagEntity, IHashtag } from '@/domain/entities/hashtag.entity';
import { IPost, PostEntity } from '@/domain/entities/post.entity';
import { EPostAudience, EPostType } from '@/domain/enums/posts.enum';
import {
  ICountPostsInput,
  ICountPostsTypeInput,
  ICreatePostInput,
  IFindAndUpsertHashtagsInput,
  IFindGuestPostsInput,
  IFindPostByIdInput,
  IFindPostIdsWhereViewerInteractedWithAuthorsInput,
  IFindPostIdsWhereViewerInteractedWithAuthorsOutput,
  IFindPostsInput,
  IFindPostsTypeInput,
  IIncreasePostsViewsInput,
  IIncreasePostViewsInput,
  IIsViewerInteractedWithPostInput,
  IPostDetailOutput,
  IPostDetailWithAuthorOutput,
  IUpdatePostAudienceAndStrangerCommentsInput
} from '@/domain/repositories/post/post.interface';
import { IPostRepository } from '@/domain/repositories/post/post.repository';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';

import { PostMapper } from '@/infrastructure/persistence/mapper/post.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { IHashtagModel } from '@/infrastructure/persistence/mongodb/models/hashtag.model';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';

import { AnyBulkWriteOperation, Document, ObjectId } from 'mongodb';

export const buildBasePostPipeline = ({
  match,
  skip,
  limit,
  includeAuthor = false
}: {
  match?: Record<string, unknown>;
  skip?: number;
  limit?: number;
  includeAuthor?: boolean;
}) => {
  const pipeline: Document[] = [];

  if (match) {
    pipeline.push({ $match: match });
    pipeline.push({ $sort: { createdAt: -1, _id: -1 } });
  }

  if (typeof skip === 'number') {
    pipeline.push({ $skip: skip });
  }

  if (typeof limit === 'number') {
    pipeline.push({ $limit: limit });
  }

  if (includeAuthor) {
    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                username: 1,
                avatar: 1
              }
            }
          ],
          as: 'author'
        }
      },
      {
        $unwind: {
          path: '$author',
          preserveNullAndEmptyArrays: true
        }
      }
    );
  }

  pipeline.push(
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
        allowStrangerComments: { $ifNull: ['$allowStrangerComments', true] },
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
      }
    },
    {
      $project: {
        bookmarks: 0,
        post_child: 0
      }
    }
  );

  return pipeline;
};

export class PostRepository extends BaseRepository implements IPostRepository {
  constructor(
    readonly db: DatabaseService,
    private readonly mapper: PostMapper
  ) {
    super(db);
  }

  async isViewerInteractedWithPost(data: IIsViewerInteractedWithPostInput): Promise<boolean> {
    const v = new ObjectId(data.viewerId);
    const p = new ObjectId(data.postId);
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

  async findPostIdsWhereViewerInteractedWithAuthors(
    data: IFindPostIdsWhereViewerInteractedWithAuthorsInput
  ): Promise<IFindPostIdsWhereViewerInteractedWithAuthorsOutput> {
    const { viewerId, authorIds } = data;
    if (authorIds.length === 0) {
      return { ids: [] };
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
    const ids: string[] = [];
    for (const row of [...fromLikes, ...fromBookmarks, ...fromComments]) {
      const id = row._id.toString();
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
    return { ids };
  }

  async findPostDetailById(data: IFindPostByIdInput): Promise<IPostDetailOutput> {
    const { postId } = data;
    const pipelineGetDetailPost = [
      {
        $match: {
          _id: new ObjectId(postId)
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
    const [post] = await this.db.posts.aggregate<IPostDetailOutput>(pipelineGetDetailPost).toArray();

    return post;
  }

  async findPosts(data: IFindPostsInput): Promise<IPostDetailWithAuthorOutput[]> {
    const { userId, friendUserIds, blockedAuthorIds, extraVisiblePostIds, cursor, limit } = data;
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

    return this.db.posts.aggregate<IPostDetailWithAuthorOutput>(pipelineGetNewFeeds).toArray();
  }

  async findGuestPosts(data: IFindGuestPostsInput): Promise<IPostDetailWithAuthorOutput[]> {
    const { cursor, limit } = data;
    const match: Record<string, unknown> = {
      audience: EPostAudience.PUBLIC
    };
    if (cursor) {
      const cursorId = new ObjectId(cursor.id);
      match.$or = [{ createdAt: { $lt: cursor.createdAt } }, { createdAt: cursor.createdAt, _id: { $lt: cursorId } }];
    }

    const pipelineGetGuestNewFeeds = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: true
    });

    return this.db.posts.aggregate<IPostDetailWithAuthorOutput>(pipelineGetGuestNewFeeds).toArray();
  }

  async findPostsType(data: IFindPostsTypeInput): Promise<IPostDetailOutput[]> {
    const { cursor, limit, postId, type } = data;
    const match: Record<string, unknown> = {
      parentId: new ObjectId(postId),
      type
    };
    if (cursor) {
      const cursorId = new ObjectId(cursor.id);
      match.$or = [{ createdAt: { $lt: cursor.createdAt } }, { createdAt: cursor.createdAt, _id: { $lt: cursorId } }];
    }

    const pipelineGetPostsType = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: false
    });

    const posts = await this.db.posts.aggregate<IPostDetailOutput>(pipelineGetPostsType).toArray();
    return posts;
  }

  async findPostById(data: IFindPostByIdInput): Promise<IPost | null> {
    const result = await this.db.posts.findOne({ _id: new ObjectId(data.postId) });
    return result ? this.mapper.toDomain(result) : null;
  }

  async createPost(data: ICreatePostInput): Promise<IPost> {
    const { userId, type, audience, allowStrangerComments, content, parentId, hashtags, mentions, media } = data;
    const post = PostEntity.create({
      id: '123',
      userId,
      type,
      audience,
      allowStrangerComments,
      content,
      parentId,
      hashtags,
      mentions,
      media,
      guestViews: 0,
      userViews: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await this.db.posts.insertOne(this.mapper.toPersistence(post));
    return post;
  }

  async updatePostAudienceAndStrangerComments(
    data: IUpdatePostAudienceAndStrangerCommentsInput
  ): Promise<IPost | null> {
    const { postId, ownerUserId, audience, allowStrangerComments } = data;
    const result = await this.db.posts.findOneAndUpdate(
      { _id: new ObjectId(postId), userId: new ObjectId(ownerUserId) },
      {
        $set: {
          audience,
          allowStrangerComments,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async increasePostViews(data: IIncreasePostViewsInput): Promise<IPost | null> {
    const { postId, userId } = data;
    const result = await this.db.posts.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $inc: userId ? { userViews: 1 } : { guestViews: 1 }, $currentDate: { updatedAt: true } },
      { returnDocument: 'after', projection: { userViews: 1, guestViews: 1, updatedAt: 1 } }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async increasePostsViews(data: IIncreasePostsViewsInput): Promise<number> {
    const { ids, isAuthenticatedViewer } = data;
    if (ids.length === 0) {
      return 0;
    }
    const postIds = ids.map((id) => new ObjectId(id));
    const res = await this.db.posts.updateMany(
      { _id: { $in: postIds } },
      {
        $inc: isAuthenticatedViewer ? { userViews: 1 } : { guestViews: 1 },
        $currentDate: { updatedAt: true }
      }
    );
    return res.modifiedCount;
  }

  async countPosts(data: ICountPostsInput): Promise<number> {
    const { userId, friendUserIds, blockedAuthorIds, extraVisiblePostIds } = data;
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

  async countGuestPosts(): Promise<number> {
    const match = {
      audience: EPostAudience.PUBLIC
    };

    const totalPosts = await this.count(this.db.posts, match);
    return totalPosts;
  }

  async countPostsType(data: ICountPostsTypeInput): Promise<number> {
    const { postId, type } = data;
    const match = {
      parentId: new ObjectId(postId),
      type
    };
    const totalPosts = await this.count(this.db.posts, match);
    return totalPosts;
  }

  async findAndUpsertHashtags(data: IFindAndUpsertHashtagsInput): Promise<(IHashtag | null)[]> {
    const { hashtags } = data;
    if (hashtags.length === 0) return [];

    const now = new Date();
    const ops: AnyBulkWriteOperation<IHashtagModel>[] = hashtags.map((name) => ({
      updateOne: {
        filter: { name: new ObjectId(name) },
        update: { $setOnInsert: { id: '123', name: new ObjectId(name), createdAt: now } },
        upsert: true
      }
    }));

    // Thực hiện bulkWrite để upsert (chèn mới hoặc cập nhật) nhiều hashtag cùng lúc.
    // option { ordered: false } cho phép các thao tác upsert diễn ra song song, không dừng lại khi có 1 thao tác bị lỗi (ví dụ trùng key),
    // Điều này giúp tối ưu hiệu suất khi insert nhiều hashtag cùng lúc và không bị ảnh hưởng nếu có hashtag đã tồn tại.
    // Tránh loop find one and update vì N + 1 query (nhiều round-trip).
    await this.db.hashtags.bulkWrite(ops, { ordered: false });

    const result = await this.db.hashtags
      .find({ name: { $in: hashtags.map((name) => new ObjectId(name)) } }, { projection: { _id: 1, name: 1 } })
      .toArray();
    return result.map((item) =>
      HashtagEntity.create({ id: item._id.toString(), name: item.name.toString(), createdAt: item.createdAt })
    );
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
    const cursorId = new ObjectId(cursor.id);
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
