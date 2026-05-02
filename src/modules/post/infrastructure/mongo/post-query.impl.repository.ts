import { BookmarkModel } from '@/modules/bookmark/infrastructure/mongo/bookmark.model';
import { EMediaType } from '@/modules/common/domain/enums/media.enum';
import { ESearchPeople, ESearchType } from '@/modules/common/domain/enums/search.enum';
import { DateIdCursor } from '@/modules/common/domain/value-objects/date-id-cursor.value-object';
import { LikeModel } from '@/modules/like/infrastructure/mongo/like.model';
import { PostQueryRepositoryPort } from '@/modules/post/application/ports/queries/post-query.repository';
import {
  IFindGuestPostsInput,
  IFindPostIdsWhereViewerInteractedWithAuthorsInput,
  IFindPostsForSearchInput,
  IFindPostsInput,
  IFindPostsTypeInput,
  IIsViewerInteractedWithPostInput,
  IPostDetailOutput,
  IPostDetailWithAuthorOutput
} from '@/modules/post/application/ports/queries/post-query.type';
import { EPostAudience, EPostType } from '@/modules/post/domain/entities/post.type';
import { PostMapper } from '@/modules/post/infrastructure/mappers/post.mapper';
import { PostModel } from '@/modules/post/infrastructure/mongo/post.model';
import { Collection, Db, Document, MongoClient } from 'mongodb';

export class PostQueryRepository implements PostQueryRepositoryPort {
  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: PostMapper
  ) {}

  get dbCollection(): Collection<PostModel> {
    return this.db.collection<PostModel>('posts');
  }

  get likesCollection(): Collection<LikeModel> {
    return this.db.collection<LikeModel>('likes');
  }

  get bookmarksCollection(): Collection<BookmarkModel> {
    return this.db.collection<BookmarkModel>('bookmarks');
  }

  async isViewerInteractedWithPost({ postId, viewerId: userId }: IIsViewerInteractedWithPostInput): Promise<boolean> {
    // const v = new ObjectId(data.viewerId);
    // const p = new ObjectId(data.postId);
    const [like, bookmark, comment] = await Promise.all([
      // Tìm like của viewer với post (likes.findOne)
      this.likesCollection.findOne({ userId, postId }, { projection: { _id: 1 } }),
      // Tìm bookmark của viewer với post (bookmarks.findOne)
      this.bookmarksCollection.findOne({ userId, postId }, { projection: { _id: 1 } }),
      // Tìm comment mà viewer comment vào post đó (posts.findOne với parentId = postId và type = COMMENT)
      this.dbCollection.findOne({ userId, parentId: postId, type: EPostType.COMMENT }, { projection: { _id: 1 } })
    ]);
    // Nếu có ít nhất 1 trong 3 loại tương tác thì trả true
    return like !== null || bookmark !== null || comment !== null;
  }

  async findPostDetailById(id: string): Promise<IPostDetailOutput> {
    const pipelineGetDetailPost = [
      {
        $match: {
          _id: id
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
        $addFields: {
          hashtags: {
            $map: {
              input: '$hashtags',
              as: 'hashtag',
              in: {
                id: '$$hashtag._id',
                name: '$$hashtag.name',
                createdAt: '$$hashtag.createdAt',
                updatedAt: '$$hashtag.updatedAt'
              }
            }
          }
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
                id: '$$mention._id',
                name: '$$mention.name',
                username: '$$mention.username',
                status: '$$mention.status'
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'bookmarks',
          let: { rootPostId: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$postId', '$$rootPostId'] } } }, { $count: 'totalBookmarks' }],
          as: 'bookmarkCountLookupResults'
        }
      },
      {
        $lookup: {
          from: 'posts',
          let: { rootPostId: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$parentId', '$$rootPostId'] } } }, { $project: { _id: 0, type: 1 } }],
          as: 'childPostsWithTypeOnly'
        }
      },
      {
        $addFields: {
          bookmarkCount: {
            $ifNull: [{ $arrayElemAt: ['$bookmarkCountLookupResults.totalBookmarks', 0] }, 0]
          },
          repostCount: {
            $size: {
              $filter: {
                input: '$childPostsWithTypeOnly',
                as: 'childPost',
                cond: { $eq: ['$$childPost.type', EPostType.REPOST] }
              }
            }
          },
          commentCount: {
            $size: {
              $filter: {
                input: '$childPostsWithTypeOnly',
                as: 'childPost',
                cond: { $eq: ['$$childPost.type', EPostType.COMMENT] }
              }
            }
          },
          quoteCount: {
            $size: {
              $filter: {
                input: '$childPostsWithTypeOnly',
                as: 'childPost',
                cond: { $eq: ['$$childPost.type', EPostType.QUOTE] }
              }
            }
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: [{ id: '$_id' }, '$$ROOT'] }
        }
      },
      {
        $project: {
          _id: 0,
          bookmarkCountLookupResults: 0,
          childPostsWithTypeOnly: 0
        }
      }
    ];
    const [post] = await this.dbCollection.aggregate<IPostDetailOutput>(pipelineGetDetailPost).toArray();

    return post;
  }

  async findPostIdsWhereViewerInteractedWithAuthors(
    data: IFindPostIdsWhereViewerInteractedWithAuthorsInput
  ): Promise<string[]> {
    const { viewerId, authorIds } = data;
    if (authorIds.length === 0) return [];

    const [fromLikes, fromBookmarks, fromComments] = await Promise.all([
      this.likesCollection
        .aggregate<{ _id: string }>([
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
      this.bookmarksCollection
        .aggregate<{ _id: string }>([
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
      this.dbCollection
        .aggregate<{ _id: string }>([
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

    const ids = new Set<string>(); // dedupe ids
    for (const row of [...fromLikes, ...fromBookmarks, ...fromComments]) {
      ids.add(row._id);
    }
    return Array.from(ids);
  }

  async findPosts(data: IFindPostsInput): Promise<IPostDetailWithAuthorOutput[]> {
    const { userId, friendUserIds, blockedAuthorIds, extraVisiblePostIds, cursor, limit } = data;
    const blocked = blockedAuthorIds.filter((id) => id !== userId);
    const friendIds = friendUserIds.filter((id) => id !== userId);

    const match = this.buildFeedMatch({
      viewerId: userId,
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

    return this.dbCollection.aggregate<IPostDetailWithAuthorOutput>(pipelineGetNewFeeds).toArray();
  }

  async findGuestPosts(data: IFindGuestPostsInput): Promise<IPostDetailWithAuthorOutput[]> {
    const { cursor, limit } = data;
    const match: Record<string, unknown> = {
      audience: EPostAudience.PUBLIC
    };
    if (cursor) {
      match.$or = [
        { createdAt: { $lt: cursor.raw().createdAt } },
        { createdAt: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
      ];
    }

    const pipelineGetGuestNewFeeds = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: true
    });

    return this.dbCollection.aggregate<IPostDetailWithAuthorOutput>(pipelineGetGuestNewFeeds).toArray();
  }

  async findPostsType(data: IFindPostsTypeInput): Promise<IPostDetailOutput[]> {
    const { cursor, limit, postId, type } = data;
    const match: Record<string, unknown> = {
      parentId: postId,
      type
    };
    if (cursor) {
      match.$or = [
        { createdAt: { $lt: cursor.raw().createdAt } },
        { createdAt: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
      ];
    }

    const pipelineGetPostsType = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: false
    });

    const posts = await this.dbCollection.aggregate<IPostDetailOutput>(pipelineGetPostsType).toArray();
    return posts;
  }

  async findPostsForSearch({
    query,
    userId,
    type,
    people,
    blockedAuthorIds,
    extraVisiblePostIds,
    limit,
    cursor,
    findFriendUserIds
  }: IFindPostsForSearchInput): Promise<IPostDetailWithAuthorOutput[]> {
    // const baseMatch = await this._getPostMatch(payload);
    // const match = this._mergeCreatedAtIdCursor(baseMatch, cursor);
    const match: Record<string, unknown> = {};
    const $and: Record<string, unknown>[] = [];

    if (query) {
      // tìm kiếm theo text trong các trường của post
      $and.push({
        $text: {
          $search: query
        }
      });
    }

    if (type) {
      // tìm kiếm theo type của post
      if ([ESearchType.VIDEO, ESearchType.VIDEO_STREAM].includes(type)) {
        $and.push({ 'media.type': { $in: [EMediaType.VIDEO, EMediaType.VIDEO_STREAM] } });
      } else if (type === ESearchType.IMAGE) {
        $and.push({ 'media.type': type });
      }
    }

    // Nếu đang đăng nhập thì hiển thị post PUBLIC và post FRIENDS_ONLY (bạn bè) (không bị block)
    // Nếu không đăng nhập thì chỉ hiển thị post PUBLIC
    if (userId) {
      const blocked = (blockedAuthorIds ?? []).filter((id) => id !== userId);
      const friendIds = await findFriendUserIds(userId);
      const friendIdsFriendsOnly = friendIds.filter((id) => id !== userId);

      // Chỉ hiển thị post PUBLIC và post FRIENDS_ONLY (bạn bè) (không bị block)
      const orVisibility: Record<string, unknown>[] = [
        {
          audience: EPostAudience.PUBLIC,
          userId: { $nin: blocked }
        },
        { userId: userId },
        {
          audience: EPostAudience.FRIENDS_ONLY,
          userId: { $in: friendIdsFriendsOnly, $nin: blocked }
        }
      ];
      // nếu viewer từng tương tác (like/bookmark/comment) với bài của các tác giả bị block, thì vẫn lấy ra postId của các bài đó để hiển thị (Unknown user)
      if (extraVisiblePostIds && extraVisiblePostIds.length > 0) {
        orVisibility.push({ _id: { $in: extraVisiblePostIds } });
      }
      $and.push({ $or: orVisibility });

      if (people) {
        // tìm kiếm theo bạn bè và không phải bạn bè
        if ([ESearchPeople.FRIENDS, ESearchPeople.NOT_FRIENDS].includes(people)) {
          $and.push({
            userId: people === ESearchPeople.FRIENDS ? { $in: friendIds } : { $nin: friendIds }
          });
        } else if (people === ESearchPeople.ONLY_ME) {
          // tìm kiếm theo chính mình
          $and.push({ userId: { $eq: userId } });
        }
      }
    } else {
      $and.push({ audience: EPostAudience.PUBLIC });
    }

    if ($and.length === 1) {
      match['$and'] = $and[0];
    } else {
      match['$and'] = $and;
    }

    // build cursor filter
    if (cursor) {
      // Ý nghĩa nghiệp vụ: đảm bảo khi nhiều post có cùng createdAt, việc paging vẫn không bị trùng/miss do dùng thêm _id làm tie-breaker.
      const cursorFilter = {
        $or: [
          { createdAt: { $lt: cursor.raw().createdAt } },
          { createdAt: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
        ]
      };
      match['$and'] = [match, cursorFilter];
    }

    const pipelineGetNewFeeds = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: true
    });
    return this.dbCollection.aggregate<IPostDetailWithAuthorOutput>(pipelineGetNewFeeds).toArray();
  }

  private buildFeedMatch({
    viewerId,
    blocked,
    friendIds,
    extraVisiblePostIds,
    cursor
  }: {
    viewerId: string;
    blocked: string[];
    friendIds: string[];
    extraVisiblePostIds?: string[];
    cursor?: DateIdCursor;
  }): Record<string, unknown> {
    const orBranches: Record<string, unknown>[] = [
      {
        audience: EPostAudience.PUBLIC,
        userId: { $nin: blocked }
      },
      { userId: viewerId },
      {
        audience: EPostAudience.FRIENDS_ONLY,
        userId: { $in: friendIds, $nin: blocked }
      }
    ];
    if (extraVisiblePostIds && extraVisiblePostIds.length > 0) {
      orBranches.push({ _id: { $in: extraVisiblePostIds } });
    }

    const base: Record<string, unknown> = { $or: orBranches };
    if (!cursor) {
      return base;
    }

    return {
      $and: [
        base,
        {
          $or: [
            { createdAt: { $lt: cursor.raw().createdAt } },
            { createdAt: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
          ]
        }
      ]
    };
  }
}

// TODO: move to utils
function buildBasePostPipeline({
  match,
  skip,
  limit,
  includeAuthor = false
}: {
  match?: Record<string, unknown>;
  skip?: number;
  limit?: number;
  includeAuthor?: boolean;
}) {
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
              // $project: {
              //   _id: 0,
              //   id: '$_id',
              //   name: 1,
              //   email: 1,
              //   username: 1,
              //   avatar: 1
              // }
              $replaceRoot: {
                newRoot: {
                  id: '$_id',
                  name: '$name',
                  email: '$email',
                  username: '$username',
                  avatar: '$avatar'
                }
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
      $addFields: {
        hashtags: {
          $map: {
            input: '$hashtags',
            as: 'hashtag',
            in: {
              id: '$$hashtag._id',
              name: '$$hashtag.name',
              createdAt: '$$hashtag.createdAt',
              updatedAt: '$$hashtag.updatedAt'
            }
          }
        }
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
              id: '$$mention._id',
              name: '$$mention.name',
              username: '$$mention.username',
              status: '$$mention.status'
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: 'bookmarks',
        let: { rootPostId: '$_id' },
        pipeline: [{ $match: { $expr: { $eq: ['$postId', '$$rootPostId'] } } }, { $count: 'totalBookmarks' }],
        as: 'bookmarkCountLookupResults'
      }
    },
    {
      $lookup: {
        from: 'posts',
        let: { rootPostId: '$_id' },
        pipeline: [{ $match: { $expr: { $eq: ['$parentId', '$$rootPostId'] } } }, { $project: { _id: 0, type: 1 } }],
        as: 'childPostsWithTypeOnly'
      }
    },
    {
      $addFields: {
        bookmarkCount: {
          $ifNull: [{ $arrayElemAt: ['$bookmarkCountLookupResults.totalBookmarks', 0] }, 0]
        },
        repostCount: {
          $size: {
            $filter: {
              input: '$childPostsWithTypeOnly',
              as: 'childPost',
              cond: { $eq: ['$$childPost.type', EPostType.REPOST] }
            }
          }
        },
        commentCount: {
          $size: {
            $filter: {
              input: '$childPostsWithTypeOnly',
              as: 'childPost',
              cond: { $eq: ['$$childPost.type', EPostType.COMMENT] }
            }
          }
        },
        quoteCount: {
          $size: {
            $filter: {
              input: '$childPostsWithTypeOnly',
              as: 'childPost',
              cond: { $eq: ['$$childPost.type', EPostType.QUOTE] }
            }
          }
        }
      }
    },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: [{ id: '$_id' }, '$$ROOT'] }
      }
    },
    {
      $project: {
        _id: 0,
        bookmarkCountLookupResults: 0,
        childPostsWithTypeOnly: 0
      }
    }
  );

  return pipeline;
}
