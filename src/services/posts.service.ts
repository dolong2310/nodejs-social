import { ICreatePostRequestBody } from '@/models/requests/post.request';
import { IPostDetailResponse } from '@/models/responses/post.response';
import HashtagSchema, { IHashtag } from '@/models/schemas/hashtag.schema';
import PostSchema, { IPost } from '@/models/schemas/post.schema';
import databaseService from '@/services/database.service';
import { ObjectId, WithId } from 'mongodb';

class PostsService {
  constructor() {}

  async findPostDetail(postId: string): Promise<WithId<IPostDetailResponse> | null> {
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
                  $eq: ['$$item.type', 'repost']
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
                  $eq: ['$$item.type', 'comment']
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
                  $eq: ['$$item.type', 'quote']
                }
              }
            }
          },
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
    const [post] = await databaseService.posts.aggregate<WithId<IPostDetailResponse>>(pipelineGetDetailPost).toArray();
    return post;
  }

  findPostById(postId: string): Promise<WithId<IPost> | null> {
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
  }): Promise<WithId<Pick<IPost, 'userViews' | 'guestViews'>> | null> {
    return databaseService.posts.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $inc: userId ? { userViews: 1 } : { guestViews: 1 }, $currentDate: { updatedAt: true } },
      { returnDocument: 'after', projection: { userViews: 1, guestViews: 1 } }
    );
  }

  async createPost({ userId, body }: { userId: string; body: ICreatePostRequestBody }) {
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
}

export default new PostsService();
