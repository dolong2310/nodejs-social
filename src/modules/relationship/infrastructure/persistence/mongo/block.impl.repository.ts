import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { BlockEntity } from '@/modules/relationship/domain/entities/block.entity';
import { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';
import { BlockMapper } from '@/modules/relationship/infrastructure/persistence/mongo/block.mapper';
import { BlockModel } from '@/modules/relationship/infrastructure/persistence/mongo/block.model';
import { Db, MongoClient, MongoServerError } from 'mongodb';

export class BlockRepository extends MongoRepositoryBase<BlockEntity, BlockModel> implements BlockRepositoryPort {
  protected collectionName = 'blocks';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: BlockMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean> {
    const record = await this.dbCollection.findOne(
      {
        $or: [
          { blocker_id: userIdA, blocked_id: userIdB },
          { blocker_id: userIdB, blocked_id: userIdA }
        ]
      },
      { projection: { _id: 1 } }
    );
    return record !== null;
  }

  async listBlockedUserIdsForBlocker(blockerId: string): Promise<string[]> {
    const ids = await this.dbCollection.distinct('blocked_id', { blocker_id: blockerId });
    return ids;
  }

  /**
   * All user ids that have a block edge with `viewerId` (either as blocker or blocked).
   */
  async listUserIdsBlockedInEitherDirection(userId: string): Promise<string[]> {
    const [blockerIds, blockedIds] = await Promise.all([
      this.dbCollection.distinct('blocked_id', { blocker_id: userId }),
      this.dbCollection.distinct('blocker_id', { blocked_id: userId })
    ]);
    return Array.from(new Set([...blockerIds, ...blockedIds])); // dedupe ids
  }

  async createBlock(blockerId: string, blockedId: string): Promise<void> {
    const entity = BlockEntity.create({ blockerId, blockedId });
    const record = this.mapper.toPersistence(entity);
    try {
      await this.dbCollection.insertOne(record);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new Error('Block already exists', { cause: error });
      }
      throw error;
    }
  }

  async deleteBlock(blockerId: string, blockedId: string): Promise<number> {
    const result = await this.dbCollection.deleteOne({
      blocker_id: blockerId,
      blocked_id: blockedId
    });
    return result.deletedCount;
  }
}
