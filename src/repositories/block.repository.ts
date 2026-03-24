/*
 * BlockRepository — BLCK-02 symmetric query helpers for Phase 3 feed filtering.
 */

import BlockSchema from '@/models/block.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { ObjectId } from 'mongodb';

export interface IBlockRepository {
  isBlockedEitherWay(a: ObjectId, b: ObjectId): Promise<boolean>;
  listUserIdsBlockedInEitherDirection(viewerId: ObjectId): Promise<ObjectId[]>;
  createBlock(blockerId: ObjectId, blockedId: ObjectId): Promise<void>;
  deleteBlock(blockerId: ObjectId, blockedId: ObjectId): Promise<number>;
  listBlockedUserIdsForBlocker(blockerId: ObjectId): Promise<ObjectId[]>;
}

function dedupeObjectIds(ids: ObjectId[]): ObjectId[] {
  const seen = new Set<string>();
  const out: ObjectId[] = [];
  for (const id of ids) {
    const k = id.toHexString();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(id);
    }
  }
  return out;
}

export class BlockRepository extends BaseRepository implements IBlockRepository {
  async isBlockedEitherWay(a: ObjectId, b: ObjectId): Promise<boolean> {
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
  async listUserIdsBlockedInEitherDirection(viewerId: ObjectId): Promise<ObjectId[]> {
    const [asBlocker, asBlocked] = await Promise.all([
      this.db.blocks.distinct('blockedId', { blockerId: viewerId }),
      this.db.blocks.distinct('blockerId', { blockedId: viewerId })
    ]);
    return dedupeObjectIds([...(asBlocker as ObjectId[]), ...(asBlocked as ObjectId[])]);
  }

  async createBlock(blockerId: ObjectId, blockedId: ObjectId): Promise<void> {
    const doc = new BlockSchema({ blockerId, blockedId });
    await this.db.blocks.insertOne(doc);
  }

  async deleteBlock(blockerId: ObjectId, blockedId: ObjectId): Promise<number> {
    const result = await this.db.blocks.deleteOne({ blockerId, blockedId });
    return result.deletedCount;
  }

  async listBlockedUserIdsForBlocker(blockerId: ObjectId): Promise<ObjectId[]> {
    const ids = await this.db.blocks.distinct('blockedId', { blockerId });
    return ids as ObjectId[];
  }
}
