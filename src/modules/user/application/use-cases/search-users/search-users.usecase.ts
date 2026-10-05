import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import type { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import type { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/user/application/constants/cache.constants';
import {
  type SearchUsersInputPort,
  SearchUsersOutputPort,
  SearchUsersPort
} from '@/modules/user/application/use-cases/search-users/search-users.port';
import type { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';

export class SearchUsersUseCase extends SearchUsersPort {
  constructor(
    private readonly userQueryRepository: UserQueryRepositoryPort,
    private readonly friendService: FriendServicePort,
    private readonly cache: CacheManagerPort
  ) {
    super();
  }

  async execute(input: SearchUsersInputPort): Promise<SearchUsersOutputPort> {
    const { userId, query = '', people, cursor, limit } = input;
    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);

    const load = async (): Promise<SearchUsersOutputPort> => {
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

      return new SearchUsersOutputPort({ items, nextCursor });
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

    const result = await this.cache.read(key, load, { ttlSeconds: CACHE_TTL.SEARCH_USERS });
    return result ?? load();
  }
}
