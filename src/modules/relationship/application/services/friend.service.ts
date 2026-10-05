import type { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/relationship/application/constants/cache.constants';
import type { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';

export interface FriendServicePort {
  invalidateBoth(userIdA: string, userIdB: string): Promise<void>;
  invalidateFriendCache(userId: string): Promise<void>;
  isFriendOf(payload: { userId: string; otherUserId: string }): Promise<boolean>;
  findFriendUserIds(userId: string): Promise<string[]>;
}

export class FriendService implements FriendServicePort {
  constructor(
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly cache: CacheManagerPort
  ) {
    this.findFriendUserIds = this.findFriendUserIds.bind(this);
  }

  /**
   * The system caches each user's friend list (Redis key CACHE_KEYS.friends(userId)) for findFriendUserIds().
   * When decline/revoke/unfriend changes the friend graph or related state, invalidate both users so APIs such
   * as list friends, mutual checks, friends-only permissions, and opening direct conversations do not read stale data.
   */
  async invalidateBoth(userIdA: string, userIdB: string): Promise<void> {
    await Promise.all([this.invalidateFriendCache(userIdA), this.invalidateFriendCache(userIdB)]);
  }

  async invalidateFriendCache(userId: string): Promise<void> {
    await this.cache.invalidate(CACHE_KEYS.friends(userId));
  }

  async isFriendOf({ userId, otherUserId }: { userId: string; otherUserId: string }): Promise<boolean> {
    const friendshipEntity = await this.friendshipRepository.findFriendshipPair(userId, otherUserId);
    return friendshipEntity !== null;
  }

  async findFriendUserIds(userId: string): Promise<string[]> {
    const ids = await this.cache.read(
      CACHE_KEYS.friends(userId),
      () => this.friendshipRepository.findFriendIdsByUserId(userId),
      {
        ttlSeconds: CACHE_TTL.FRIENDS_GRAPH
      }
    );
    return ids ?? [];
  }
}
