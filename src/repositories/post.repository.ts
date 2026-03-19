/*
 * Post Repository
 * This file contains the PostRepository class which implements IPostRepository interface.
 * It provides methods to interact with the post data in the database.
 */

import { EPostAudience, EPostType } from '@/enums/posts.enum';
import { ICreatePostRequestBody } from '@/models/requests/post.request';
import { IPostDetailResponse, IPostNewFeedResponse } from '@/models/responses/post.response';
import HashtagSchema, { IHashtag } from '@/models/schemas/hashtag.schema';
import PostSchema, { IPost } from '@/models/schemas/post.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { buildBasePostPipeline } from '@/utils/posts.pipeline.util';
import { FindOneAndUpdateOptions, ObjectId, UpdateResult, AnyBulkWriteOperation } from 'mongodb';

export interface IPostRepository {
  findById(id: string): Promise<IPostDetailResponse>;
  findPosts(payload: {
    userId: string;
    followedUserIds: ObjectId[];
    page: number;
    limit: number;
  }): Promise<IPostNewFeedResponse[]>;
  countPosts(payload: { userId: string; followedUserIds: ObjectId[] }): Promise<number>;
  findGuestPosts(payload: { page: number; limit: number }): Promise<IPostNewFeedResponse[]>;
  countGuestPosts(): Promise<number>;
  findPostsType(payload: {
    page: number;
    limit: number;
    postId: string;
    type: EPostType;
  }): Promise<IPostDetailResponse[]>;
  countPostsType(payload: { postId: string; type: EPostType }): Promise<number>;
  findPostById(postId: string): Promise<IPost | null>;
  findOneAndUpdate(
    payload: { postId: string; userId?: string },
    options?: FindOneAndUpdateOptions
  ): Promise<IPost | null>;
  createPost(payload: {
    userId: string;
    body: Omit<ICreatePostRequestBody, 'hashtags'> & { hashtags: ObjectId[] };
  }): Promise<IPost>;
  updatePosts(payload: {
    posts: IPostDetailResponse[] | IPostNewFeedResponse[];
    userId?: string;
    date: Date;
  }): Promise<UpdateResult<IPost>>;
  findAndUpsertHashtags(hashtags: string[]): Promise<(IHashtag | null)[]>;
}

export class PostRepository extends BaseRepository implements IPostRepository {
  async findById(id: string): Promise<IPostDetailResponse> {
    const pipelineGetDetailPost = [
      {
        $match: {
          _id: new ObjectId(id)
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
    const [post] = await this.db.posts.aggregate<IPostDetailResponse>(pipelineGetDetailPost).toArray();

    return post;
  }

  async findPosts({
    userId,
    followedUserIds,
    page,
    limit
  }: {
    userId: string;
    followedUserIds: ObjectId[];
    page: number;
    limit: number;
  }): Promise<IPostNewFeedResponse[]> {
    /**
     * Bộ lọc (filter) này nhằm lấy các bài post hiển thị cho user:
     * - Nếu user chưa follow ai (followedUserIds là mảng rỗng),
     *   chỉ hiện các bài public, hoặc bài của chính user đó (bất kể audience gì, kể cả only_me).
     * - Nếu user đã follow ai đó:
     *   - Hiện các post của những người mình đang follow:
     *     + audience là PUBLIC hoặc FOLLOWERS.
     *     + audience là ONLY_ME thì chỉ lấy bài của chính mình (khi userId trùng với người đang đăng nhập).
     */
    let match: Record<string, unknown>;

    if (!followedUserIds || followedUserIds.length === 0) {
      match = {
        $or: [{ audience: EPostAudience.PUBLIC }, { userId: new ObjectId(userId) }]
      };
    } else {
      match = {
        userId: {
          $in: followedUserIds
        },
        $or: [
          { audience: EPostAudience.PUBLIC },
          { audience: EPostAudience.FOLLOWERS },
          {
            $and: [
              { audience: EPostAudience.ONLY_ME },
              {
                userId: {
                  $eq: new ObjectId(userId)
                }
              }
            ]
          }
        ]
      };
    }

    const pipelineGetNewFeeds = buildBasePostPipeline({
      match,
      skip: limit * (page - 1),
      limit,
      includeAuthor: true
    });

    const posts = await this.db.posts.aggregate<IPostNewFeedResponse>(pipelineGetNewFeeds).toArray();
    return posts;
  }

  async countPosts({ userId, followedUserIds }: { userId: string; followedUserIds: ObjectId[] }): Promise<number> {
    let match: Record<string, unknown>;

    if (!followedUserIds || followedUserIds.length === 0) {
      match = {
        $or: [{ audience: EPostAudience.PUBLIC }, { userId: new ObjectId(userId) }]
      };
    } else {
      match = {
        userId: { $in: followedUserIds },
        $or: [
          { audience: EPostAudience.PUBLIC },
          { audience: EPostAudience.FOLLOWERS },
          {
            $and: [{ audience: EPostAudience.ONLY_ME }, { userId: { $eq: new ObjectId(userId) } }]
          }
        ]
      };
    }

    return this.count(this.db.posts, match);
  }

  async findGuestPosts({ page, limit }: { page: number; limit: number }): Promise<IPostNewFeedResponse[]> {
    const match = {
      audience: EPostAudience.PUBLIC
    };

    const pipelineGetGuestNewFeeds = buildBasePostPipeline({
      match,
      skip: limit * (page - 1),
      limit,
      includeAuthor: true
    });

    const posts = await this.db.posts.aggregate<IPostNewFeedResponse>(pipelineGetGuestNewFeeds).toArray();
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
  }): Promise<IPostDetailResponse[]> {
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

    const posts = await this.db.posts.aggregate<IPostDetailResponse>(pipelineGetPostsType).toArray();
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
    body: Omit<ICreatePostRequestBody, 'hashtags'> & { hashtags: ObjectId[] };
  }): Promise<IPost> {
    const { type, audience, content, parentId, hashtags, mentions, media } = body;

    const newPost = new PostSchema({
      userId: new ObjectId(userId),
      type,
      audience,
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

  updatePosts({
    posts,
    userId,
    date
  }: {
    posts: IPostDetailResponse[] | IPostNewFeedResponse[];
    userId?: string;
    date: Date;
  }): Promise<UpdateResult<IPost>> {
    return this.db.posts.updateMany(
      { _id: { $in: posts.map((post) => post._id!) } },
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

    await this.db.hashtags.bulkWrite(ops, { ordered: false });

    return this.db.hashtags.find({ name: { $in: hashtags } }).toArray();
  }
}
