import { BlockEntity } from '@/modules/block/domain/entities/block.entity';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface BlockRepositoryPort extends RepositoryPort<BlockEntity> {
  isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean>;
  listBlockedUserIdsForBlocker(blockerId: string): Promise<string[]>;
  listUserIdsBlockedInEitherDirection(userId: string): Promise<string[]>;
  createBlock(blockerId: string, blockedId: string): Promise<void>;
  deleteBlock(blockerId: string, blockedId: string): Promise<number>;
}
