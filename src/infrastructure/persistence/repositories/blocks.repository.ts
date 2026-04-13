import { BlockAlreadyExistsException } from '@/application/errors/block.error';
import {
  ICreateBlockInput,
  IDeleteBlockInput,
  IIsBlockedEitherWayInput,
  IListBlockedUserIdsForBlockerInput,
  IListBlockedUserIdsForBlockerOutput,
  IListUserIdsBlockedInEitherDirectionInput
} from '@/domain/repositories/block/block.interface';
import { IBlockRepository } from '@/domain/repositories/block/block.repository';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';
import { MongoServerError, ObjectId } from 'mongodb';

function dedupeIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

export class BlockRepository extends BaseRepository implements IBlockRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async isBlockedEitherWay(data: IIsBlockedEitherWayInput): Promise<boolean> {
    const { aUserId, bUserId } = data;
    const a = new ObjectId(aUserId);
    const b = new ObjectId(bUserId);
    const doc = await this.db.blocks.findOne(
      {
        $or: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a }
        ]
      },
      { projection: { _id: 1 } }
    );
    return doc !== null;
  }

  /**
   * All user ids that have a block edge with `viewerId` (either as blocker or blocked).
   */
  async listUserIdsBlockedInEitherDirection({
    viewerUserId
  }: IListUserIdsBlockedInEitherDirectionInput): Promise<IListBlockedUserIdsForBlockerOutput> {
    const viewerId = new ObjectId(viewerUserId);
    const [asBlocker, asBlocked] = await Promise.all([
      this.db.blocks.distinct('blockedId', { blockerId: viewerId }),
      this.db.blocks.distinct('blockerId', { blockedId: viewerId })
    ]);
    const ids = [...asBlocker, ...asBlocked].map((id) => id.toString());
    return { ids: dedupeIds(ids) };
  }

  async createBlock(data: ICreateBlockInput): Promise<void> {
    const { blockerId, blockedId } = data;
    try {
      await this.db.blocks.insertOne({
        blockerId: new ObjectId(blockerId),
        blockedId: new ObjectId(blockedId)
      });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw BlockAlreadyExistsException;
      }
      throw error;
    }
  }

  async deleteBlock(data: IDeleteBlockInput): Promise<number> {
    const result = await this.db.blocks.deleteOne({
      blockerId: new ObjectId(data.blockerId),
      blockedId: new ObjectId(data.blockedId)
    });
    return result.deletedCount;
  }

  async listBlockedUserIdsForBlocker(
    data: IListBlockedUserIdsForBlockerInput
  ): Promise<IListBlockedUserIdsForBlockerOutput> {
    const ids = await this.db.blocks.distinct('blockedId', { blockerId: new ObjectId(data.blockerId) });
    return { ids: ids.map((id) => id.toString()) };
  }
}
