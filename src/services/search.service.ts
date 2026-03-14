import { EMediaType } from '@/enums/media.enum';
import { EPostAudience } from '@/enums/posts.enum';
import { ESearchPeopleFollow, ESearchType } from '@/enums/search.enum';
import { IPostDetailResponse } from '@/models/responses/post.response';
import { IUser } from '@/models/schemas/user.schema';
import databaseService from '@/services/database.service';
import followersService from '@/services/followers.service';
import postsService from '@/services/posts.service';
import { buildBasePostPipeline } from '@/utils/posts.pipeline.util';
import { Document, ObjectId } from 'mongodb';

class SearchService {
  constructor() {}

  async searchPosts({
    userId,
    query,
    type,
    peopleFollow,
    page,
    limit
  }: {
    userId?: string;
    query: string;
    type?: ESearchType;
    peopleFollow?: ESearchPeopleFollow;
    page: number;
    limit: number;
  }): Promise<[IPostDetailResponse[], number]> {
    const match: Record<string, any> = {
      // $text: {
      //   $search: query
      // },
      audience: EPostAudience.PUBLIC
    };

    if (query) {
      match['$text'] = {
        $search: query
      };
    }

    // Filter media type
    if (type) {
      if ([ESearchType.VIDEO, ESearchType.VIDEO_HLS].includes(type)) {
        match['media.type'] = { $in: [EMediaType.VIDEO, EMediaType.VIDEO_HLS] };
      } else if (type === ESearchType.IMAGE) {
        match['media.type'] = type;
      }
    }

    // Filter audience by people follow
    if (peopleFollow && userId) {
      if ([ESearchPeopleFollow.FOLLOWING, ESearchPeopleFollow.NOT_FOLLOWING].includes(peopleFollow)) {
        const followedUserIds = await followersService.findFollowedUserIds(userId);

        match['userId'] =
          peopleFollow === ESearchPeopleFollow.FOLLOWING ? { $in: followedUserIds } : { $nin: followedUserIds };
      } else if (peopleFollow === ESearchPeopleFollow.ONLY_ME) {
        match['userId'] = { $eq: new ObjectId(userId) };
      }
    }

    // Filter audience by user id
    if (userId) {
      delete match.audience;
      match['$or'] = [
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
      ];
    }

    const pipelineGetNewFeeds = buildBasePostPipeline({
      match,
      skip: limit * (page - 1),
      limit,
      includeAuthor: true
    });

    const postsPromise = databaseService.posts.aggregate<IPostDetailResponse>(pipelineGetNewFeeds).toArray();
    const totalPostsPromise = databaseService.posts.countDocuments(match);
    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    const updatedPosts = await postsService._updatePostsViews<IPostDetailResponse>({ posts, userId });

    return [updatedPosts, totalPosts];
  }

  async searchUsers({
    userId,
    query,
    peopleFollow,
    page,
    limit
  }: {
    userId?: string;
    query: string;
    peopleFollow?: ESearchPeopleFollow;
    page: number;
    limit: number;
  }): Promise<[IUser[], number]> {
    // Tìm kiếm users theo query (tìm kiếm theo name, username, email)
    // Nếu có userId (có nghĩa là đang login) thì có thể filter theo people follow, nếu không thì chỉ tìm tất cả users

    const match: Record<string, any> = {
      // $text: {
      //   $search: query
      // }
    };

    if (query) {
      match['$text'] = {
        $search: query
      };
    }

    if (peopleFollow && userId) {
      if ([ESearchPeopleFollow.FOLLOWING, ESearchPeopleFollow.NOT_FOLLOWING].includes(peopleFollow)) {
        const followedUserIds = await followersService.findFollowedUserIds(userId);
        match['_id'] =
          peopleFollow === ESearchPeopleFollow.FOLLOWING ? { $in: followedUserIds } : { $nin: followedUserIds };
      } else if (peopleFollow === ESearchPeopleFollow.ONLY_ME) {
        match['_id'] = { $eq: new ObjectId(userId) };
      }
    }

    const pipeline: Document[] = [
      { $match: match },
      {
        $project: {
          password: 0,
          emailVerificationToken: 0,
          forgotPasswordToken: 0
        }
      },
      { $skip: limit * (page - 1) },
      { $limit: limit }
    ];

    const usersPromise = databaseService.users.aggregate<IUser>(pipeline).toArray();
    const totalUsersPromise = databaseService.users.countDocuments(match);
    const [users, totalUsers] = await Promise.all([usersPromise, totalUsersPromise]);

    return [users, totalUsers];
  }
}

export default new SearchService();
