import { EPostAudience, EPostType } from '@/enums/posts.enum';
import { ICreatePostRequestBody } from '@/models/requests/post.request';
import { IPostDetailResponse, IPostNewFeedResponse } from '@/models/responses/post.response';
import HashtagSchema, { IHashtag } from '@/models/schemas/hashtag.schema';
import PostSchema, { IPost } from '@/models/schemas/post.schema';
import databaseService from '@/services/database.service';
import { buildBasePostPipeline } from '@/utils/posts.pipeline.util';
import { ObjectId, WithId } from 'mongodb';

class PostsService {
  constructor() {}

  async findPostDetail(postId: string) {
    const pipelineGetDetailPost = [
      {
        $match: {
          _id: new ObjectId(postId)
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
    const [post] = await databaseService.posts.aggregate<IPostDetailResponse>(pipelineGetDetailPost).toArray();

    return post;
  }

  async getNewFeeds({
    userId,
    followedUserIds,
    page,
    limit
  }: {
    userId: string;
    followedUserIds: ObjectId[];
    page: number;
    limit: number;
  }) {
    const match = {
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

    const pipelineGetNewFeeds = buildBasePostPipeline({
      match,
      skip: limit * (page - 1),
      limit,
      includeAuthor: true
    });

    const postsPromise = databaseService.posts.aggregate<IPostNewFeedResponse>(pipelineGetNewFeeds).toArray();
    const totalPostsPromise = databaseService.posts.countDocuments(match);
    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    const updatedPosts = await this._updatePostsViews<IPostNewFeedResponse>({ posts, userId });

    return { posts: updatedPosts, totalPosts };
  }

  async getGuestNewFeeds({ page, limit }: { page: number; limit: number }) {
    const match = {
      audience: EPostAudience.PUBLIC
    };

    const pipelineGetGuestNewFeeds = buildBasePostPipeline({
      match,
      skip: limit * (page - 1),
      limit,
      includeAuthor: true
    });

    const postsPromise = databaseService.posts.aggregate<IPostNewFeedResponse>(pipelineGetGuestNewFeeds).toArray();
    const totalPostsPromise = databaseService.posts.countDocuments(match);
    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    const updatedPosts = await this._updatePostsViews<IPostNewFeedResponse>({ posts });

    return { posts: updatedPosts, totalPosts };
  }

  async getPostsType({
    userId,
    page,
    limit,
    postId,
    type
  }: {
    userId?: string;
    page: number;
    limit: number;
    postId: string;
    type: EPostType;
  }) {
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

    const postsPromise = databaseService.posts.aggregate<IPostDetailResponse>(pipelineGetPostsType).toArray();
    const totalPostsPromise = databaseService.posts.countDocuments(match);
    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    const updatedPosts = await this._updatePostsViews<IPostDetailResponse>({ posts, userId });

    return { posts: updatedPosts, totalPosts };
  }

  findPostById(postId: string): Promise<IPost | null> {
    return databaseService.posts.findOne({ _id: new ObjectId(postId) });
  }

  findAndUpsertHashtags(hashtags: string[]): Promise<(WithId<IHashtag> | null)[]> {
    return Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          { $setOnInsert: new HashtagSchema({ name: hashtag }) },
          { upsert: true, returnDocument: 'after' }
        );
      })
    );
  }

  increaseViews({
    postId,
    userId
  }: {
    postId: string;
    userId?: string;
  }): Promise<WithId<Pick<IPost, 'userViews' | 'guestViews' | 'updatedAt'>> | null> {
    return databaseService.posts.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $inc: userId ? { userViews: 1 } : { guestViews: 1 }, $currentDate: { updatedAt: true } },
      { returnDocument: 'after', projection: { userViews: 1, guestViews: 1, updatedAt: 1 } }
    );
  }

  async createPost({ userId, body }: { userId: string; body: ICreatePostRequestBody }): Promise<IPost> {
    const { type, audience, content, parentId, hashtags: hashtagsBody, mentions, media } = body;

    const hashtags = await this.findAndUpsertHashtags(hashtagsBody);
    const hashtagIds = hashtags.filter(Boolean).map((hashtag) => hashtag!._id);

    const newPost = new PostSchema({
      userId: new ObjectId(userId),
      type,
      audience,
      content,
      parentId: parentId ? new ObjectId(parentId) : null,
      hashtags: hashtagIds,
      mentions: mentions.map((mention) => new ObjectId(mention)),
      media,
      guestViews: 0,
      userViews: 0
    });
    await databaseService.posts.insertOne(newPost);

    return newPost;
  }

  async _updatePostsViews<T extends IPostDetailResponse | IPostNewFeedResponse>({
    posts,
    userId
  }: {
    posts: T[];
    userId?: string;
  }): Promise<T[]> {
    const date = new Date();

    // increase views for each post
    await databaseService.posts.updateMany(
      { _id: { $in: posts.map((post) => post._id!) } },
      {
        $inc: userId ? { userViews: 1 } : { guestViews: 1 },
        $set: { updatedAt: date }
        // $currentDate: { updatedAt: true },
      }
    );

    // update post with new views
    return posts.map((post) => ({
      ...post,
      updatedAt: date,
      userViews: userId ? post.userViews + 1 : post.userViews,
      guestViews: userId ? post.guestViews : post.guestViews + 1
    }));
  }
}

export default new PostsService();
