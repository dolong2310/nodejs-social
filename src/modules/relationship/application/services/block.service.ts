import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/relationship/application/constants/cache.constants';
import { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';

export interface BlockServicePort {
  isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean>;
  getBlockedIdsByUserId(userId: string): Promise<string[]>;
}

export class BlockService implements BlockServicePort {
  constructor(
    private readonly blockRepository: BlockRepositoryPort,
    private readonly cache: CacheManagerPort
  ) {}

  async isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean> {
    const isBlocked = await this.blockRepository.isBlockedEitherWay(userIdA, userIdB);
    return isBlocked;
  }

  /**
   * Load users with a block relationship to the viewer and cache them briefly in Redis.
   * - Avoid repeated DB queries while loading feeds/posts.
   * - Normalize two-way block data: users blocked by viewer and users who blocked viewer.
   * - Used by block-related post hiding/redaction logic.
   */
  async getBlockedIdsByUserId(userId: string): Promise<string[]> {
    const key = CACHE_KEYS.blockedUserIds(userId);
    const ids = await this.cache.read(key, () => this.blockRepository.listUserIdsBlockedInEitherDirection(userId), {
      ttlSeconds: CACHE_TTL.BLOCKED_USER_IDS
    });
    return ids ?? [];
  }
}
