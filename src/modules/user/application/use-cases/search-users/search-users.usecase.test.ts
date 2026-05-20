import { EnumSearchPeople } from '@/modules/common/domain/enums/search.enum';
import { encodeCursor } from '@/modules/common/utils/cursor.util';
import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/user/application/constants/cache.constant';
import { SearchUsersQuery } from '@/modules/user/application/use-cases/search-users/search-users.port';
import { SearchUsersUseCase } from '@/modules/user/application/use-cases/search-users/search-users.usecase';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import { makeUserSafeProps } from '@test/support/builders/user.builder';
import { mockCache, mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const firstUser = makeUserSafeProps({
  name: 'First User',
  email: 'first@example.com',
  username: 'first',
  createdAt: new Date('2026-01-02T00:00:00.000Z')
});
const secondUser = makeUserSafeProps({
  id: 'user_2',
  name: 'Second User',
  email: 'second@example.com',
  username: 'second',
  createdAt: new Date('2026-01-01T00:00:00.000Z')
});

describe('SearchUsersUseCase', () => {
  it('loads search results through cache and returns a next cursor when more rows exist', async () => {
    const query = new SearchUsersQuery({
      userId: 'viewer_1',
      query: 'user',
      people: EnumSearchPeople.FRIENDS,
      limit: '1'
    });
    const userQueryRepository = mockPort<UserQueryRepositoryPort>({
      findUsersForSearch: vi.fn().mockResolvedValue([firstUser, secondUser])
    });
    const friendService = mockPort<FriendServicePort>({
      findFriendUserIds: vi.fn().mockResolvedValue(['user_1'])
    });
    const cache = mockCache() as CacheStrategyPort;
    const useCase = new SearchUsersUseCase(userQueryRepository, friendService, cache);

    const result = await useCase.execute(query);

    expect(cache.get).toHaveBeenCalledWith(CACHE_KEYS.searchUsers(query), expect.any(Function), {
      ttlSeconds: CACHE_TTL.SEARCH_USERS
    });
    expect(result.items).toEqual([firstUser]);
    expect(result.nextCursor).toBe(encodeCursor(firstUser.createdAt, firstUser.id));
  });
});
