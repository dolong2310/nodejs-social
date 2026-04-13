import { PostNewFeedResultDTO } from '@/application/dtos/post/post.result.dto';
import { IUser } from '@/domain/entities/user.entity';
import { EMediaType } from '@/domain/enums/media.enum';
import { EPostAudience } from '@/domain/enums/posts.enum';
import { ESearchPeople, ESearchType } from '@/domain/enums/search.enum';
import { IFindPostsForSearchInput, IFindUsersForSearchInput } from '@/domain/repositories/search/search.interface';
import { ISearchRepository } from '@/domain/repositories/search/search.repository';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';
import { buildBasePostPipeline } from '@/infrastructure/persistence/repositories/posts.repository';
import { Document, ObjectId } from 'mongodb';

export class SearchRepository extends BaseRepository implements ISearchRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async findPostsForSearch(data: IFindPostsForSearchInput): Promise<PostNewFeedResultDTO[]> {
    const { limit, cursor, ...payload } = data;
    const baseMatch = await this._getPostMatch(payload);
    const match = this._mergeCreatedAtIdCursor(baseMatch, cursor);
    const pipelineGetNewFeeds = buildBasePostPipeline({
      match,
      limit: limit + 1,
      includeAuthor: true
    });
    return this.db.posts.aggregate<PostNewFeedResultDTO>(pipelineGetNewFeeds).toArray();
  }

  async findUsersForSearch(data: IFindUsersForSearchInput): Promise<IUser[]> {
    const { limit, cursor, ...payload } = data;
    const baseMatch = await this._getUserMatch(payload);
    const match = this._mergeCreatedAtIdCursor(baseMatch, cursor);
    const pipeline: Document[] = [
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $project: {
          password: 0,
          emailVerificationToken: 0,
          forgotPasswordToken: 0
        }
      },
      { $limit: limit + 1 }
    ];
    return this.db.users.aggregate<IUser>(pipeline).toArray();
  }

  private _mergeCreatedAtIdCursor(base: Record<string, unknown>, cursor?: DateIdCursor): Record<string, unknown> {
    if (!cursor) {
      return base;
    }
    const cursorId = new ObjectId(cursor.id);
    // Ý nghĩa nghiệp vụ: đảm bảo khi nhiều post có cùng createdAt, việc paging vẫn không bị trùng/miss do dùng thêm _id làm tie-breaker.
    const cursorFilter = {
      $or: [{ createdAt: { $lt: cursor.createdAt } }, { createdAt: cursor.createdAt, _id: { $lt: cursorId } }]
    };
    return { $and: [base, cursorFilter] };
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
    findFriendUserIds(userId: string): Promise<string[]>;
    blockedAuthorIds?: string[];
    extraVisiblePostIds?: string[];
  }) {
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
      if ([ESearchType.VIDEO, ESearchType.VIDEO_HLS].includes(type)) {
        $and.push({ 'media.type': { $in: [EMediaType.VIDEO, EMediaType.VIDEO_HLS] } });
      } else if (type === ESearchType.IMAGE) {
        $and.push({ 'media.type': type });
      }
    }

    // Nếu đang đăng nhập thì hiển thị post PUBLIC và post FRIENDS_ONLY (bạn bè) (không bị block)
    // Nếu không đăng nhập thì chỉ hiển thị post PUBLIC
    if (userId) {
      const viewerOid = new ObjectId(userId);
      const blocked = (blockedAuthorIds ?? []).filter((id) => id !== userId).map((id) => new ObjectId(id));
      const friendIds = await findFriendUserIds(userId);
      const friendIdsFriendsOnly = friendIds.filter((id) => id !== userId).map((id) => new ObjectId(id));

      // Chỉ hiển thị post PUBLIC và post FRIENDS_ONLY (bạn bè) (không bị block)
      const orVisibility: Record<string, unknown>[] = [
        {
          audience: EPostAudience.PUBLIC,
          userId: { $nin: blocked }
        },
        { userId: viewerOid },
        {
          audience: EPostAudience.FRIENDS_ONLY,
          userId: { $in: friendIdsFriendsOnly, $nin: blocked }
        }
      ];
      // nếu viewer từng tương tác (like/bookmark/comment) với bài của các tác giả bị block, thì vẫn lấy ra postId của các bài đó để hiển thị (Unknown user)
      if (extraVisiblePostIds && extraVisiblePostIds.length > 0) {
        orVisibility.push({ _id: { $in: extraVisiblePostIds.map((id) => new ObjectId(id)) } });
      }
      $and.push({ $or: orVisibility });

      if (people) {
        // tìm kiếm theo bạn bè và không phải bạn bè
        if ([ESearchPeople.FRIENDS, ESearchPeople.NOT_FRIENDS].includes(people)) {
          const friendOids = friendIds.map((id) => new ObjectId(id));
          $and.push({
            userId: people === ESearchPeople.FRIENDS ? { $in: friendOids } : { $nin: friendOids }
          });
        } else if (people === ESearchPeople.ONLY_ME) {
          // tìm kiếm theo chính mình
          $and.push({ userId: { $eq: viewerOid } });
        }
      }
    } else {
      $and.push({ audience: EPostAudience.PUBLIC });
    }

    if ($and.length === 1) {
      return $and[0] as Record<string, unknown>;
    }
    return { $and };
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
    findFriendUserIds(userId: string): Promise<string[]>;
  }) {
    const match: Record<string, unknown> = {};

    if (query) {
      // tìm kiếm theo text trong các trường của user
      match['$text'] = {
        $search: query
      };
    }

    if (people && userId) {
      // tìm kiếm theo bạn bè và không phải bạn bè
      if ([ESearchPeople.FRIENDS, ESearchPeople.NOT_FRIENDS].includes(people)) {
        const friendIds = await findFriendUserIds(userId);
        const friendOids = friendIds.map((id) => new ObjectId(id));
        match['_id'] = people === ESearchPeople.FRIENDS ? { $in: friendOids } : { $nin: friendOids };
      } else if (people === ESearchPeople.ONLY_ME) {
        // tìm kiếm theo chính mình
        match['_id'] = { $eq: new ObjectId(userId) };
      }
    }
    return match;
  }
}
