import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/friend/application/constants/cache.constant';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';

export interface FriendServicePort {
  invalidateBoth(userIdA: string, userIdB: string): Promise<void>;
  invalidateFriendCache(userId: string): Promise<void>;
  isFriendOf(payload: { userId: string; otherUserId: string }): Promise<boolean>;
  findFriendUserIds(userId: string): Promise<string[]>;
}

export class FriendService implements FriendServicePort {
  constructor(
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly cacheManager: CacheManagerPort
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
    await this.cacheManager.del(CACHE_KEYS.friends(userId));
  }

  async isFriendOf({ userId, otherUserId }: { userId: string; otherUserId: string }): Promise<boolean> {
    const friendshipEntity = await this.friendshipRepository.findFriendshipPair(userId, otherUserId);
    return friendshipEntity !== null;
  }

  async findFriendUserIds(userId: string): Promise<string[]> {
    const idsCached = await this.cacheManager.get<string[]>(CACHE_KEYS.friends(userId));
    if (!idsCached) {
      const friendUserIds = await this.friendshipRepository.findFriendIdsByUserId(userId);
      await this.cacheManager.set(CACHE_KEYS.friends(userId), friendUserIds, CACHE_TTL.FRIENDS_GRAPH);
      return friendUserIds;
    }
    return idsCached;
  }
}
