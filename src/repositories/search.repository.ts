/*
 * Search Repository
 * This file contains the SearchRepository class which implements ISearchRepository interface.
 * It provides methods to interact with the search data in the database.
 */

import { PostDetailResponseDTO } from '@/dtos/responses/post.response.dto';
import { EMediaType } from '@/enums/media.enum';
import { EPostAudience } from '@/enums/posts.enum';
import { ESearchPeople, ESearchType } from '@/enums/search.enum';
import { IUser } from '@/models/user.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { buildBasePostPipeline } from '@/utils/posts.pipeline.util';
import { Document, ObjectId } from 'mongodb';

export interface ISearchRepository {
  findPosts(payload: {
    userId?: string;
    query: string;
    type?: ESearchType;
    people?: ESearchPeople;
    page: number;
    limit: number;
    findFriendUserIds(userId: string): Promise<ObjectId[]>;
    blockedAuthorIds?: ObjectId[];
    extraVisiblePostIds?: ObjectId[];
  }): Promise<PostDetailResponseDTO[]>;
  countPosts(payload: {
    userId?: string;
    query: string;
    type?: ESearchType;
    people?: ESearchPeople;
    findFriendUserIds(userId: string): Promise<ObjectId[]>;
    blockedAuthorIds?: ObjectId[];
    extraVisiblePostIds?: ObjectId[];
  }): Promise<number>;
  findUsers(payload: {
    userId?: string;
    query: string;
    people?: ESearchPeople;
    page: number;
    limit: number;
    findFriendUserIds(userId: string): Promise<ObjectId[]>;
  }): Promise<IUser[]>;
  countUsers(payload: {
    userId?: string;
    query: string;
    people?: ESearchPeople;
    findFriendUserIds(userId: string): Promise<ObjectId[]>;
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
    people?: ESearchPeople;
    page: number;
    limit: number;
    findFriendUserIds(userId: string): Promise<ObjectId[]>;
    blockedAuthorIds?: ObjectId[];
    extraVisiblePostIds?: ObjectId[];
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
    people?: ESearchPeople;
    findFriendUserIds(userId: string): Promise<ObjectId[]>;
    blockedAuthorIds?: ObjectId[];
    extraVisiblePostIds?: ObjectId[];
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
    people?: ESearchPeople;
    page: number;
    limit: number;
    findFriendUserIds(userId: string): Promise<ObjectId[]>;
  }): Promise<IUser[]> {
    // Tìm kiếm users theo query (tìm kiếm theo name, username, email)
    // Nếu có userId (đang login) thì có thể filter theo `people`; không thì chỉ tìm tất cả users

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
    people?: ESearchPeople;
    findFriendUserIds(userId: string): Promise<ObjectId[]>;
  }): Promise<number> {
    const match = await this._getUserMatch(payload);
    const totalUsers = await this.db.users.countDocuments(match);
    return totalUsers;
  }

  private async _getPostMatch({
    query,
    type,
    people,
    userId,
    findFriendUserIds,
    blockedAuthorIds,
    extraVisiblePostIds
  }: {
    userId?: string;
    query: string;
    type?: ESearchType;
    people?: ESearchPeople;
    findFriendUserIds(userId: string): Promise<ObjectId[]>;
    blockedAuthorIds?: ObjectId[];
    extraVisiblePostIds?: ObjectId[];
  }) {
    const andClauses: Record<string, unknown>[] = [];

    if (query) {
      andClauses.push({
        $text: {
          $search: query
        }
      });
    }

    if (type) {
      if ([ESearchType.VIDEO, ESearchType.VIDEO_HLS].includes(type)) {
        andClauses.push({ 'media.type': { $in: [EMediaType.VIDEO, EMediaType.VIDEO_HLS] } });
      } else if (type === ESearchType.IMAGE) {
        andClauses.push({ 'media.type': type });
      }
    }

    if (userId) {
      const viewerOid = new ObjectId(userId);
      const blocked = (blockedAuthorIds ?? []).filter((id) => !id.equals(viewerOid));
      const friendIds = (await findFriendUserIds(userId)).filter((id) => !id.equals(viewerOid));

      const orVisibility: Record<string, unknown>[] = [
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
        orVisibility.push({ _id: { $in: extraVisiblePostIds } });
      }
      andClauses.push({ $or: orVisibility });

      if (people) {
        if ([ESearchPeople.FRIENDS, ESearchPeople.NOT_FRIENDS].includes(people)) {
          const friendUserIds = await findFriendUserIds(userId);
          andClauses.push({
            userId: people === ESearchPeople.FRIENDS ? { $in: friendUserIds } : { $nin: friendUserIds }
          });
        } else if (people === ESearchPeople.ONLY_ME) {
          andClauses.push({ userId: { $eq: viewerOid } });
        }
      }
    } else {
      andClauses.push({ audience: EPostAudience.PUBLIC });
    }

    if (andClauses.length === 1) {
      return andClauses[0] as Record<string, unknown>;
    }
    return { $and: andClauses };
  }

  private async _getUserMatch({
    userId,
    query,
    people,
    findFriendUserIds
  }: {
    userId?: string;
    query: string;
    people?: ESearchPeople;
    findFriendUserIds(userId: string): Promise<ObjectId[]>;
  }) {
    const match: Record<string, unknown> = {};

    if (query) {
      match['$text'] = {
        $search: query
      };
    }

    if (people && userId) {
      if ([ESearchPeople.FRIENDS, ESearchPeople.NOT_FRIENDS].includes(people)) {
        const friendUserIds = await findFriendUserIds(userId);
        match['_id'] = people === ESearchPeople.FRIENDS ? { $in: friendUserIds } : { $nin: friendUserIds };
      } else if (people === ESearchPeople.ONLY_ME) {
        match['_id'] = { $eq: new ObjectId(userId) };
      }
    }
    return match;
  }
}
