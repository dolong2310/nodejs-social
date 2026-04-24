import { CACHE_KEYS, CACHE_TTL } from '@/application/common/constants/cache.constant';
import { RedisPort } from '@/application/ports/redis.port';
import { BlockRepositoryPort } from '@/domain/repositories/block/block.repository';

export interface IBlockService {
  isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean>;
  getBlockedIdsByUserId(userId: string): Promise<string[]>;
}

export class BlockService implements IBlockService {
  constructor(
    private readonly blockRepository: BlockRepositoryPort,
    private readonly redis: RedisPort
  ) {}

  async isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean> {
    const isBlocked = await this.blockRepository.isBlockedEitherWay(userIdA, userIdB);
    return isBlocked;
  }

  /**
   * Lấy danh sách user đang có quan hệ block với viewer và cache ngắn hạn bằng Redis.
   * - Tránh query DB lặp lại nhiều lần khi load feed/bài viết.
   * - Chuẩn hóa dữ liệu “block hai chiều”: gồm cả người dùng mà viewer block và người block lại viewer.
   * - Dùng cho logic ẩn/che thông tin bài viết liên quan block (ở flow lấy posts).
   */
  async getBlockedIdsByUserId(userId: string): Promise<string[]> {
    const key = CACHE_KEYS.blockedUserIds(userId);
    const ids = await this.redis.getOrSet(
      key,
      () => this.blockRepository.listUserIdsBlockedInEitherDirection(userId),
      CACHE_TTL.BLOCKED_USER_IDS
    );
    return ids;
  }
}
