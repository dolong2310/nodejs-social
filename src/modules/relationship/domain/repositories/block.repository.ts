import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { BlockEntity } from '@/modules/relationship/domain/entities/block.entity';

export interface BlockRepositoryPort extends RepositoryPort<BlockEntity> {
  isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean>;
  listBlockedUserIdsForBlocker(blockerId: string): Promise<string[]>;
  listUserIdsBlockedInEitherDirection(userId: string): Promise<string[]>;
  createBlock(blockerId: string, blockedId: string): Promise<void>;
  deleteBlock(blockerId: string, blockedId: string): Promise<number>;
}
