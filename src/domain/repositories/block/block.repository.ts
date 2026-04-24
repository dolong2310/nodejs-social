import { BlockEntity } from '@/domain/entities/block/block.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';

export interface BlockRepositoryPort extends RepositoryPort<BlockEntity> {
  isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean>;
  listBlockedUserIdsForBlocker(blockerId: string): Promise<string[]>;
  listUserIdsBlockedInEitherDirection(userId: string): Promise<string[]>;
  createBlock(blockerId: string, blockedId: string): Promise<void>;
  deleteBlock(blockerId: string, blockedId: string): Promise<number>;
}
