/*
 * Search Repository
 * This file contains the SearchRepository class which implements ISearchRepository interface.
 * It provides methods to interact with the search data in the database.
 */

import { PostDetailResponseDTO } from '@/dtos/responses/post.response.dto';
import { EMediaType } from '@/enums/media.enum';
import { EPostAudience } from '@/enums/posts.enum';
import { ESearchPeopleFollow, ESearchType } from '@/enums/search.enum';
import { IUser } from '@/models/schemas/user.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { buildBasePostPipeline } from '@/utils/posts.pipeline.util';
import { Document, ObjectId } from 'mongodb';

export interface ISearchRepository {
  findPosts(payload: {
    userId?: string;
    query: string;
    type?: ESearchType;
    peopleFollow?: ESearchPeopleFollow;
    page: number;
    limit: number;
    findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  }): Promise<PostDetailResponseDTO[]>;
  countPosts(payload: {
    userId?: string;
    query: string;
    type?: ESearchType;
    peopleFollow?: ESearchPeopleFollow;
    findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  }): Promise<number>;
  findUsers(payload: {
    userId?: string;
    query: string;
    peopleFollow?: ESearchPeopleFollow;
    page: number;
    limit: number;
    findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  }): Promise<IUser[]>;
  countUsers(payload: {
    userId?: string;
    query: string;
    peopleFollow?: ESearchPeopleFollow;
    findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  }): Promise<number>;
}

export class SearchRepository extends BaseRepository implements ISearchRepository {
  async findPosts({
    page,
    limit,
    ...payload
  }: {
    userId?: string;
    query: string;
    type?: ESearchType;
    peopleFollow?: ESearchPeopleFollow;
    page: number;
    limit: number;
    findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  }): Promise<PostDetailResponseDTO[]> {
    const match = await this._getPostMatch(payload);
    const pipelineGetNewFeeds = buildBasePostPipeline({
      match,
      skip: limit * (page - 1),
      limit,
      includeAuthor: true
    });

    const posts = await this.db.posts.aggregate<PostDetailResponseDTO>(pipelineGetNewFeeds).toArray();
    return posts;
  }

  async countPosts(payload: {
    userId?: string;
    query: string;
    type?: ESearchType;
    peopleFollow?: ESearchPeopleFollow;
    findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  }): Promise<number> {
    const match = await this._getPostMatch(payload);
    return this.count(this.db.posts, match);
  }

  async findUsers({
    page,
    limit,
    ...payload
  }: {
    userId?: string;
    query: string;
    peopleFollow?: ESearchPeopleFollow;
    page: number;
    limit: number;
    findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  }): Promise<IUser[]> {
    // Tìm kiếm users theo query (tìm kiếm theo name, username, email)
    // Nếu có userId (có nghĩa là đang login) thì có thể filter theo people follow, nếu không thì chỉ tìm tất cả users

    const match = await this._getUserMatch(payload);

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

    const users = await this.db.users.aggregate<IUser>(pipeline).toArray();
    return users;
  }

  async countUsers(payload: {
    userId?: string;
    query: string;
    peopleFollow?: ESearchPeopleFollow;
    findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  }): Promise<number> {
    const match = await this._getUserMatch(payload);
    const totalUsers = await this.db.users.countDocuments(match);
    return totalUsers;
  }

  private async _getPostMatch({
    query,
    type,
    peopleFollow,
    userId,
    findFollowedUserIds
  }: {
    userId?: string;
    query: string;
    type?: ESearchType;
    peopleFollow?: ESearchPeopleFollow;
    findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  }) {
    const match: Record<string, unknown> = {
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
        const followedUserIds = await findFollowedUserIds(userId);

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
    return match;
  }

  private async _getUserMatch({
    userId,
    query,
    peopleFollow,
    findFollowedUserIds
  }: {
    userId?: string;
    query: string;
    peopleFollow?: ESearchPeopleFollow;
    findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  }) {
    const match: Record<string, unknown> = {};

    if (query) {
      match['$text'] = {
        $search: query
      };
    }

    if (peopleFollow && userId) {
      if ([ESearchPeopleFollow.FOLLOWING, ESearchPeopleFollow.NOT_FOLLOWING].includes(peopleFollow)) {
        const followedUserIds = await findFollowedUserIds(userId);
        match['_id'] =
          peopleFollow === ESearchPeopleFollow.FOLLOWING ? { $in: followedUserIds } : { $nin: followedUserIds };
      } else if (peopleFollow === ESearchPeopleFollow.ONLY_ME) {
        match['_id'] = { $eq: new ObjectId(userId) };
      }
    }
    return match;
  }
}
