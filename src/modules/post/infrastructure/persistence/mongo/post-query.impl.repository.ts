import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { EnumSearchPeople, EnumSearchType } from '@/modules/common/domain/enums/search.enum';
import { DateIdCursor } from '@/modules/common/domain/value-objects/cursor.value-object';
import { EnumPostAudience, EnumPostType } from '@/modules/post/domain/entities/post.type';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import {
  FindGuestPostsInput,
  FindPostIdsWhereUserInteractedWithAuthorsInput,
  FindPostsByUserIdInput,
  FindPostsByUserInteractionInput,
  FindPostsForSearchInput,
  FindPostsInput,
  FindPostsTypeInput,
  IsUserInteractedWithPostInput,
  PostDetailWithAuthorOutput
} from '@/modules/post/domain/repositories/post.query.type';
import { BookmarkModel } from '@/modules/post/infrastructure/persistence/mongo/bookmark.model';
import { LikeModel } from '@/modules/post/infrastructure/persistence/mongo/like.model';
import { PostMapper } from '@/modules/post/infrastructure/persistence/mongo/post.mapper';
import { PostModel } from '@/modules/post/infrastructure/persistence/mongo/post.model';
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

  async isUserInteractedWithPost({ postId, userId }: IsUserInteractedWithPostInput): Promise<boolean> {
    // const v = new ObjectId(data.userId);
    // const p = new ObjectId(data.postId);
    const [like, bookmark, comment] = await Promise.all([
      // Find the user's like for the post (likes.findOne).
      this.likesCollection.findOne({ user_id: userId, post_id: postId, deleted_at: null }, { projection: { _id: 1 } }),
      // Find the user's bookmark for the post (bookmarks.findOne).
      this.bookmarksCollection.findOne(
        { user_id: userId, post_id: postId, deleted_at: null },
        { projection: { _id: 1 } }
      ),
      // Find a comment the user added to that post (posts.findOne with parentId = postId and type = COMMENT).
      this.dbCollection.findOne(
        { user_id: userId, parent_id: postId, type: EnumPostType.COMMENT, deleted_at: null },
        { projection: { _id: 1 } }
      )
    ]);
    // Return true if at least one of the three interaction types exists.
    return like !== null || bookmark !== null || comment !== null;
  }

  async findPostDetailById(id: string, currentUserId?: string): Promise<PostDetailWithAuthorOutput> {
    const pipelineGetDetailPost = buildBasePostPipeline({
      match: { _id: id },
      limit: 1,
      includeAuthor: true,
      currentUserId
    });
    const [post] = await this.dbCollection.aggregate<PostDetailWithAuthorOutput>(pipelineGetDetailPost).toArray();

    return post;
  }

  async findPostIdsWhereUserInteractedWithAuthors(
    data: FindPostIdsWhereUserInteractedWithAuthorsInput
  ): Promise<string[]> {
    const { userId, authorIds } = data;
    if (authorIds.length === 0) return [];

    const [fromLikes, fromBookmarks, fromComments] = await Promise.all([
      this.likesCollection
        .aggregate<{ _id: string }>([
          { $match: { user_id: userId, deleted_at: null } },
          {
            $lookup: {
              from: 'posts',
              localField: 'post_id',
              foreignField: '_id',
              as: 'post'
            }
          },
          { $unwind: '$post' },
          { $match: { 'post.user_id': { $in: authorIds }, 'post.deleted_at': null } },
          { $group: { _id: '$post_id' } }
        ])
        .toArray(),
      this.bookmarksCollection
        .aggregate<{ _id: string }>([
          { $match: { user_id: userId, deleted_at: null } },
          {
            $lookup: {
              from: 'posts',
              localField: 'post_id',
              foreignField: '_id',
              as: 'post'
            }
          },
          { $unwind: '$post' },
          { $match: { 'post.user_id': { $in: authorIds }, 'post.deleted_at': null } },
          { $group: { _id: '$post_id' } }
        ])
        .toArray(),
      this.dbCollection
        .aggregate<{ _id: string }>([
          {
            $match: {
              user_id: userId,
              type: EnumPostType.COMMENT,
              parent_id: { $ne: null },
              deleted_at: null
            }
          },
          {
            $lookup: {
              from: 'posts',
              localField: 'parent_id',
              foreignField: '_id',
              as: 'parent'
            }
          },
          { $unwind: '$parent' },
          { $match: { 'parent.user_id': { $in: authorIds }, 'parent.deleted_at': null } },
          { $group: { _id: '$parent_id' } }
        ])
        .toArray()
    ]);

    const ids = new Set<string>(); // dedupe ids
    for (const row of [...fromLikes, ...fromBookmarks, ...fromComments]) {
      ids.add(row._id);
    }
    return Array.from(ids);
  }

  async findPosts(data: FindPostsInput): Promise<PostDetailWithAuthorOutput[]> {
    const { userId, friendUserIds, blockedAuthorIds, extraVisiblePostIds, authorUserIds, cursor, limit } = data;
    const blocked = blockedAuthorIds.filter((id) => id !== userId);
    const friendIds = friendUserIds.filter((id) => id !== userId);

    const match = this.buildFeedMatch({
      userId,
      blocked,
      friendIds,
      extraVisiblePostIds,
      authorUserIds,
      cursor
    });

    const pipelineGetNewFeeds = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: true,
      currentUserId: userId
    });

    return this.dbCollection.aggregate<PostDetailWithAuthorOutput>(pipelineGetNewFeeds).toArray();
  }

  async findGuestPosts(data: FindGuestPostsInput): Promise<PostDetailWithAuthorOutput[]> {
    const { cursor, limit } = data;
    const match: Record<string, unknown> = {
      audience: EnumPostAudience.PUBLIC,
      type: { $in: [EnumPostType.POST, EnumPostType.REPOST] },
      deleted_at: null
    };
    if (cursor) {
      match.$or = [
        { created_at: { $lt: cursor.raw().createdAt } },
        { created_at: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
      ];
    }

    const pipelineGetGuestNewFeeds = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: true
    });

    return this.dbCollection.aggregate<PostDetailWithAuthorOutput>(pipelineGetGuestNewFeeds).toArray();
  }

  async findPostsByUserId({
    targetUserId,
    currentUserId,
    type,
    canViewFriendsOnly,
    includeOnlyMe,
    cursor,
    limit
  }: FindPostsByUserIdInput): Promise<PostDetailWithAuthorOutput[]> {
    const $and: Record<string, unknown>[] = [{ user_id: targetUserId }];
    const visibility: Record<string, unknown>[] = [{ audience: EnumPostAudience.PUBLIC }];

    if (canViewFriendsOnly) {
      visibility.push({ audience: EnumPostAudience.FRIENDS_ONLY });
    } else if (currentUserId) {
      visibility.push({ audience: EnumPostAudience.FRIENDS_ONLY, mentions: currentUserId });
    }

    if (includeOnlyMe) {
      visibility.push({ audience: EnumPostAudience.ONLY_ME });
    }

    $and.push({ $or: visibility });

    if (type) {
      $and.push({ type });
    }

    if (cursor) {
      $and.push({
        $or: [
          { created_at: { $lt: cursor.raw().createdAt } },
          { created_at: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
        ]
      });
    }

    const pipelineGetPostsByUser = buildBasePostPipeline({
      match: { $and },
      limit: limit + 1,
      includeAuthor: true,
      currentUserId
    });

    return this.dbCollection.aggregate<PostDetailWithAuthorOutput>(pipelineGetPostsByUser).toArray();
  }

  async findPostsByUserInteraction({
    currentUserId,
    interaction,
    friendUserIds,
    blockedAuthorIds,
    extraVisiblePostIds,
    cursor,
    limit
  }: FindPostsByUserInteractionInput): Promise<PostDetailWithAuthorOutput[]> {
    const interactionCollection = interaction === 'likes' ? this.likesCollection : this.bookmarksCollection;
    const interactionRows = await interactionCollection
      .find({ user_id: currentUserId, deleted_at: null }, { projection: { post_id: 1 } })
      .toArray();
    const postIds = interactionRows.map((row) => row.post_id);

    if (postIds.length === 0) {
      return [];
    }

    const blocked = blockedAuthorIds.filter((id) => id !== currentUserId);
    const friendIds = friendUserIds.filter((id) => id !== currentUserId);
    const visibility: Record<string, unknown>[] = [
      {
        audience: EnumPostAudience.PUBLIC,
        user_id: { $nin: blocked }
      },
      { user_id: currentUserId },
      {
        audience: EnumPostAudience.FRIENDS_ONLY,
        user_id: { $in: friendIds, $nin: blocked }
      },
      {
        audience: EnumPostAudience.FRIENDS_ONLY,
        mentions: currentUserId
      }
    ];

    if (extraVisiblePostIds && extraVisiblePostIds.length > 0) {
      visibility.push({ _id: { $in: extraVisiblePostIds } });
    }

    const match = this.withCursorFilter(
      {
        $and: [{ _id: { $in: postIds } }, { $or: visibility }]
      },
      cursor
    );

    const pipelineGetPostsByUserInteraction = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: true,
      currentUserId
    });

    return this.dbCollection.aggregate<PostDetailWithAuthorOutput>(pipelineGetPostsByUserInteraction).toArray();
  }

  async findPostsType(data: FindPostsTypeInput): Promise<PostDetailWithAuthorOutput[]> {
    const { cursor, limit, postId, type, currentUserId } = data;
    const match: Record<string, unknown> = {
      parent_id: postId,
      type,
      deleted_at: null
    };
    if (cursor) {
      match.$or = [
        { created_at: { $lt: cursor.raw().createdAt } },
        { created_at: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
      ];
    }

    const pipelineGetPostsType = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: true,
      currentUserId
    });

    const posts = await this.dbCollection.aggregate<PostDetailWithAuthorOutput>(pipelineGetPostsType).toArray();
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
  }: FindPostsForSearchInput): Promise<PostDetailWithAuthorOutput[]> {
    const match: Record<string, unknown> = {};
    const $and: Record<string, unknown>[] = [{ deleted_at: null }];

    if (query) {
      // Search by text across post fields.
      $and.push({
        $text: {
          $search: query
        }
      });
    }

    if (type) {
      // Search by post type.
      if ([EnumSearchType.VIDEO, EnumSearchType.VIDEO_STREAM].includes(type)) {
        $and.push({ 'media.type': { $in: [EnumMediaType.VIDEO, EnumMediaType.VIDEO_STREAM] } });
      } else if (type === EnumSearchType.IMAGE) {
        $and.push({ 'media.type': type });
      }
    }

    // When authenticated, show PUBLIC posts and FRIENDS_ONLY posts from friends, excluding blocked users.
    // When unauthenticated, show only PUBLIC posts.
    if (userId) {
      const blocked = (blockedAuthorIds ?? []).filter((id) => id !== userId);
      const friendIds = await findFriendUserIds(userId);
      const friendIdsFriendsOnly = friendIds.filter((id) => id !== userId);

      // Show only PUBLIC posts and FRIENDS_ONLY posts from friends, excluding blocked users.
      const orVisibility: Record<string, unknown>[] = [
        {
          audience: EnumPostAudience.PUBLIC,
          user_id: { $nin: blocked }
        },
        { user_id: userId },
        {
          audience: EnumPostAudience.FRIENDS_ONLY,
          user_id: { $in: friendIdsFriendsOnly, $nin: blocked }
        }
      ];
      // If the user previously interacted with posts by blocked authors, still load those postIds for display as Unknown user.
      if (extraVisiblePostIds && extraVisiblePostIds.length > 0) {
        orVisibility.push({ _id: { $in: extraVisiblePostIds } });
      }
      $and.push({ $or: orVisibility });

      if (people) {
        // Search by friends and non-friends.
        if ([EnumSearchPeople.FRIENDS, EnumSearchPeople.NOT_FRIENDS].includes(people)) {
          $and.push({
            user_id: people === EnumSearchPeople.FRIENDS ? { $in: friendIds } : { $nin: friendIds }
          });
        } else if (people === EnumSearchPeople.ONLY_ME) {
          // Search by the user's own posts.
          $and.push({ user_id: { $eq: userId } });
        }
      }
    } else {
      $and.push({ audience: EnumPostAudience.PUBLIC });
    }

    match['$and'] = $and;

    // build cursor filter
    if (cursor) {
      // Business meaning: when multiple posts share createdAt, using _id as a tie-breaker prevents paging duplicates/misses.
      const cursorFilter = {
        $or: [
          { created_at: { $lt: cursor.raw().createdAt } },
          { created_at: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
        ]
      };
      match['$and'] = [...$and, cursorFilter];
    }

    const pipelineGetNewFeeds = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: true,
      currentUserId: userId
    });
    return this.dbCollection.aggregate<PostDetailWithAuthorOutput>(pipelineGetNewFeeds).toArray();
  }

  private buildFeedMatch({
    userId,
    blocked,
    friendIds,
    extraVisiblePostIds,
    authorUserIds,
    cursor
  }: {
    userId: string;
    blocked: string[];
    friendIds: string[];
    extraVisiblePostIds?: string[];
    authorUserIds?: string[];
    cursor?: DateIdCursor;
  }): Record<string, unknown> {
    const orBranches: Record<string, unknown>[] = [
      {
        audience: EnumPostAudience.PUBLIC,
        user_id: { $nin: blocked }
      },
      { user_id: userId },
      {
        audience: EnumPostAudience.FRIENDS_ONLY,
        user_id: { $in: friendIds, $nin: blocked }
      }
    ];
    if (extraVisiblePostIds && extraVisiblePostIds.length > 0) {
      orBranches.push({ _id: { $in: extraVisiblePostIds } });
    }

    const base: Record<string, unknown> = {
      deleted_at: null,
      type: { $in: [EnumPostType.POST, EnumPostType.REPOST] },
      $or: orBranches
    };
    if (authorUserIds && authorUserIds.length > 0) {
      return this.withCursorFilter({ $and: [base, { user_id: { $in: authorUserIds } }] }, cursor);
    }

    return this.withCursorFilter(base, cursor);
  }

  private withCursorFilter(base: Record<string, unknown>, cursor?: DateIdCursor): Record<string, unknown> {
    if (!cursor) {
      return base;
    }

    return {
      $and: [
        base,
        {
          $or: [
            { created_at: { $lt: cursor.raw().createdAt } },
            { created_at: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
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
  includeAuthor = false,
  currentUserId
}: {
  match?: Record<string, unknown>;
  skip?: number;
  limit?: number;
  includeAuthor?: boolean;
  currentUserId?: string;
}) {
  const pipeline: Document[] = [];

  if (match) {
    pipeline.push({ $match: { deleted_at: null, ...match } });
  }

  if (match) {
    pipeline.push({ $sort: { created_at: -1, _id: -1 } });
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
          localField: 'user_id',
          foreignField: '_id',
          pipeline: [
            {
              $match: { deleted_at: null }
            },
            {
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
        let: { hashtagIds: '$hashtags' },
        pipeline: [{ $match: { deleted_at: null, $expr: { $in: ['$_id', '$$hashtagIds'] } } }],
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
              createdAt: '$$hashtag.created_at',
              updatedAt: '$$hashtag.updated_at'
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        let: { mentionIds: '$mentions' },
        pipeline: [{ $match: { deleted_at: null, $expr: { $in: ['$_id', '$$mentionIds'] } } }],
        as: 'mentions'
      }
    },
    {
      $addFields: {
        allow_stranger_comments: { $ifNull: ['$allow_stranger_comments', true] },
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
        from: 'likes',
        let: { rootPostId: '$_id' },
        pipeline: [
          { $match: { deleted_at: null, $expr: { $eq: ['$post_id', '$$rootPostId'] } } },
          { $count: 'totalLikes' }
        ],
        as: 'likeCountLookupResults'
      }
    },
    {
      $lookup: {
        from: 'bookmarks',
        let: { rootPostId: '$_id' },
        pipeline: [
          { $match: { deleted_at: null, $expr: { $eq: ['$post_id', '$$rootPostId'] } } },
          { $count: 'totalBookmarks' }
        ],
        as: 'bookmarkCountLookupResults'
      }
    },
    {
      $lookup: {
        from: 'likes',
        let: { rootPostId: '$_id' },
        pipeline: currentUserId
          ? [
              {
                $match: {
                  user_id: currentUserId,
                  deleted_at: null,
                  $expr: { $eq: ['$post_id', '$$rootPostId'] }
                }
              },
              { $limit: 1 },
              { $project: { _id: 1 } }
            ]
          : [{ $match: { _id: null } }],
        as: 'likedByMeLookupResults'
      }
    },
    {
      $lookup: {
        from: 'bookmarks',
        let: { rootPostId: '$_id' },
        pipeline: currentUserId
          ? [
              {
                $match: {
                  user_id: currentUserId,
                  deleted_at: null,
                  $expr: { $eq: ['$post_id', '$$rootPostId'] }
                }
              },
              { $limit: 1 },
              { $project: { _id: 1 } }
            ]
          : [{ $match: { _id: null } }],
        as: 'bookmarkedByMeLookupResults'
      }
    },
    {
      $lookup: {
        from: 'posts',
        let: { rootPostId: '$_id' },
        pipeline: [
          { $match: { deleted_at: null, $expr: { $eq: ['$parent_id', '$$rootPostId'] } } },
          { $project: { _id: 0, type: 1 } }
        ],
        as: 'childPostsWithTypeOnly'
      }
    },
    {
      $lookup: {
        from: 'posts',
        let: { sourcePostId: '$parent_id', rootType: '$type' },
        pipeline: buildSourcePostLookupPipeline(currentUserId),
        as: 'sourcePostLookupResults'
      }
    },
    {
      $addFields: {
        sourcePost: {
          $ifNull: [{ $arrayElemAt: ['$sourcePostLookupResults', 0] }, null]
        },
        likeCount: {
          $ifNull: [{ $arrayElemAt: ['$likeCountLookupResults.totalLikes', 0] }, 0]
        },
        bookmarkCount: {
          $ifNull: [{ $arrayElemAt: ['$bookmarkCountLookupResults.totalBookmarks', 0] }, 0]
        },
        likedByMe: {
          $gt: [{ $size: '$likedByMeLookupResults' }, 0]
        },
        bookmarkedByMe: {
          $gt: [{ $size: '$bookmarkedByMeLookupResults' }, 0]
        },
        repostCount: {
          $size: {
            $filter: {
              input: '$childPostsWithTypeOnly',
              as: 'childPost',
              cond: { $eq: ['$$childPost.type', EnumPostType.REPOST] }
            }
          }
        },
        commentCount: {
          $size: {
            $filter: {
              input: '$childPostsWithTypeOnly',
              as: 'childPost',
              cond: { $eq: ['$$childPost.type', EnumPostType.COMMENT] }
            }
          }
        },
        quoteCount: {
          $size: {
            $filter: {
              input: '$childPostsWithTypeOnly',
              as: 'childPost',
              cond: { $eq: ['$$childPost.type', EnumPostType.QUOTE] }
            }
          }
        }
      }
    },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: [postOutputProjection(), '$$ROOT'] }
      }
    },
    {
      $project: {
        _id: 0,
        user_id: 0,
        allow_stranger_comments: 0,
        parent_id: 0,
        guest_views: 0,
        user_views: 0,
        created_at: 0,
        updated_at: 0,
        likeCountLookupResults: 0,
        bookmarkCountLookupResults: 0,
        likedByMeLookupResults: 0,
        bookmarkedByMeLookupResults: 0,
        childPostsWithTypeOnly: 0,
        sourcePostLookupResults: 0
      }
    }
  );

  return pipeline;
}

function postOutputProjection(): Record<string, unknown> {
  return {
    id: '$_id',
    userId: '$user_id',
    allowStrangerComments: '$allow_stranger_comments',
    parentId: '$parent_id',
    guestViews: '$guest_views',
    userViews: '$user_views',
    createdAt: '$created_at',
    updatedAt: '$updated_at'
  };
}

function buildSourcePostLookupPipeline(currentUserId?: string): Document[] {
  return [
    {
      $match: {
        deleted_at: null,
        $expr: {
          $and: [{ $eq: ['$_id', '$$sourcePostId'] }, { $eq: ['$$rootType', EnumPostType.REPOST] }]
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        pipeline: [
          { $match: { deleted_at: null } },
          {
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
    },
    {
      $lookup: {
        from: 'hashtags',
        let: { hashtagIds: '$hashtags' },
        pipeline: [{ $match: { deleted_at: null, $expr: { $in: ['$_id', '$$hashtagIds'] } } }],
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
              createdAt: '$$hashtag.created_at',
              updatedAt: '$$hashtag.updated_at'
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        let: { mentionIds: '$mentions' },
        pipeline: [{ $match: { deleted_at: null, $expr: { $in: ['$_id', '$$mentionIds'] } } }],
        as: 'mentions'
      }
    },
    {
      $addFields: {
        allow_stranger_comments: { $ifNull: ['$allow_stranger_comments', true] },
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
        from: 'likes',
        let: { rootPostId: '$_id' },
        pipeline: [
          { $match: { deleted_at: null, $expr: { $eq: ['$post_id', '$$rootPostId'] } } },
          { $count: 'totalLikes' }
        ],
        as: 'likeCountLookupResults'
      }
    },
    {
      $lookup: {
        from: 'bookmarks',
        let: { rootPostId: '$_id' },
        pipeline: [
          { $match: { deleted_at: null, $expr: { $eq: ['$post_id', '$$rootPostId'] } } },
          { $count: 'totalBookmarks' }
        ],
        as: 'bookmarkCountLookupResults'
      }
    },
    {
      $lookup: {
        from: 'likes',
        let: { rootPostId: '$_id' },
        pipeline: currentUserId
          ? [
              {
                $match: {
                  user_id: currentUserId,
                  deleted_at: null,
                  $expr: { $eq: ['$post_id', '$$rootPostId'] }
                }
              },
              { $limit: 1 },
              { $project: { _id: 1 } }
            ]
          : [{ $match: { _id: null } }],
        as: 'likedByMeLookupResults'
      }
    },
    {
      $lookup: {
        from: 'bookmarks',
        let: { rootPostId: '$_id' },
        pipeline: currentUserId
          ? [
              {
                $match: {
                  user_id: currentUserId,
                  deleted_at: null,
                  $expr: { $eq: ['$post_id', '$$rootPostId'] }
                }
              },
              { $limit: 1 },
              { $project: { _id: 1 } }
            ]
          : [{ $match: { _id: null } }],
        as: 'bookmarkedByMeLookupResults'
      }
    },
    {
      $lookup: {
        from: 'posts',
        let: { rootPostId: '$_id' },
        pipeline: [
          { $match: { deleted_at: null, $expr: { $eq: ['$parent_id', '$$rootPostId'] } } },
          { $project: { _id: 0, type: 1 } }
        ],
        as: 'childPostsWithTypeOnly'
      }
    },
    {
      $addFields: {
        likeCount: {
          $ifNull: [{ $arrayElemAt: ['$likeCountLookupResults.totalLikes', 0] }, 0]
        },
        bookmarkCount: {
          $ifNull: [{ $arrayElemAt: ['$bookmarkCountLookupResults.totalBookmarks', 0] }, 0]
        },
        likedByMe: {
          $gt: [{ $size: '$likedByMeLookupResults' }, 0]
        },
        bookmarkedByMe: {
          $gt: [{ $size: '$bookmarkedByMeLookupResults' }, 0]
        },
        repostCount: {
          $size: {
            $filter: {
              input: '$childPostsWithTypeOnly',
              as: 'childPost',
              cond: { $eq: ['$$childPost.type', EnumPostType.REPOST] }
            }
          }
        },
        commentCount: {
          $size: {
            $filter: {
              input: '$childPostsWithTypeOnly',
              as: 'childPost',
              cond: { $eq: ['$$childPost.type', EnumPostType.COMMENT] }
            }
          }
        },
        quoteCount: {
          $size: {
            $filter: {
              input: '$childPostsWithTypeOnly',
              as: 'childPost',
              cond: { $eq: ['$$childPost.type', EnumPostType.QUOTE] }
            }
          }
        }
      }
    },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: [postOutputProjection(), '$$ROOT'] }
      }
    },
    {
      $project: {
        _id: 0,
        user_id: 0,
        allow_stranger_comments: 0,
        parent_id: 0,
        guest_views: 0,
        user_views: 0,
        created_at: 0,
        updated_at: 0,
        likeCountLookupResults: 0,
        bookmarkCountLookupResults: 0,
        likedByMeLookupResults: 0,
        bookmarkedByMeLookupResults: 0,
        childPostsWithTypeOnly: 0
      }
    }
  ];
}
