import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/relationship/application/constants/cache.constant';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';

export interface FriendServicePort {
  invalidateBoth(userIdA: string, userIdB: string): Promise<void>;
  invalidateFriendCache(userId: string): Promise<void>;
  isFriendOf(payload: { userId: string; otherUserId: string }): Promise<boolean>;
  findFriendUserIds(userId: string): Promise<string[]>;
}

export class FriendService implements FriendServicePort {
  constructor(
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly cache: CacheStrategyPort
  ) {
    this.findFriendUserIds = this.findFriendUserIds.bind(this);
  }

  /**
   * Vì hệ thống có cache danh sách bạn bè theo user (Redis key CACHE_KEYS.friends(userId)), dùng ở findFriendUserIds().
   * Khi decline/revoke/unfriend thì graph bạn bè / trạng thái liên quan thay đổi, nên cần xóa cache của cả hai người để các API khác (list friends, check mutual, permissions “friends-only”, mở direct conversation, …) không bị đọc dữ liệu cũ.
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
    const ids = await this.cache.get(
      CACHE_KEYS.friends(userId),
      () => this.friendshipRepository.findFriendIdsByUserId(userId),
      {
        ttlSeconds: CACHE_TTL.FRIENDS_GRAPH
      }
    );
    return ids ?? [];
  }
}
