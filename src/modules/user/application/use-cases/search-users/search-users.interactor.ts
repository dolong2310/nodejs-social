import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { IFriendService } from '@/modules/friend/application/services/friend.service';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/user/application/constants/cache.constant';
import { UserQueryRepositoryPort } from '@/modules/user/application/ports/queries/user-query.repository';
import {
  SearchUsersInPort,
  SearchUsersQuery,
  SearchUsersResult
} from '@/modules/user/application/use-cases/search-users/search-users.in-port';

export class SearchUsersInteractor extends SearchUsersInPort {
  constructor(
    private readonly userQueryRepository: UserQueryRepositoryPort,
    private readonly friendService: IFriendService,
    private readonly cacheManager: CacheManagerPort
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

    return this.cacheManager.getOrSet(key, load, CACHE_TTL.SEARCH_USERS);
  }
}
