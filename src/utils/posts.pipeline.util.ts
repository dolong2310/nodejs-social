import { EPostType } from '@/modules/posts/posts.enum';
import { Document } from 'mongodb';

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
    pipeline.push({ $sort: { createdAt: -1 } });
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
