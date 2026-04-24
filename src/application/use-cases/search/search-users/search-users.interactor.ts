import { CACHE_KEYS, CACHE_TTL } from '@/application/common/constants/cache.constant';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/application/common/utils/cursor.util';
import { InvalidCursorException } from '@/application/exceptions/cursor.exception';
import { RedisPort } from '@/application/ports/redis.port';
import { UserQueryRepositoryPort } from '@/application/queries/user/user-query.repository';
import { IFriendService } from '@/application/services/friend/friend.service';
import {
  SearchUsersInPort,
  SearchUsersQuery,
  SearchUsersResult
} from '@/application/use-cases/search/search-users/search-users.in-port';

export class SearchUsersInteractor extends SearchUsersInPort {
  constructor(
    private readonly userQueryRepository: UserQueryRepositoryPort,
    private readonly friendService: IFriendService,
    private readonly redis: RedisPort
  ) {
    super();
  }

  async execute({ userId, query = '', people, cursor, limit }: SearchUsersQuery): Promise<SearchUsersResult> {
    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);

    const load = async (): Promise<SearchUsersResult> => {
      const userEntities = await this.userQueryRepository.findUsersForSearch({
        userId,
        query,
        people,
        cursor: before,
        limit,
        findFriendUserIds: this.friendService.findFriendUserIds
      });
      const hasMore = userEntities.length > limit;
      const items = userEntities.slice(0, limit);
      const last = items[items.length - 1];
      const nextCursor = hasMore && last?.createdAt ? encodeCursor(last.createdAt, last.id.toString()) : null;

      return new SearchUsersResult({ items, nextCursor });
    };

    if (CACHE_TTL.SEARCH_USERS <= 0) {
      return load();
    }

    const key = CACHE_KEYS.searchUsers({
      userId,
      query,
      people,
      cursor,
      limit
    });

    return this.redis.getOrSet(key, load, CACHE_TTL.SEARCH_USERS);
  }
}
