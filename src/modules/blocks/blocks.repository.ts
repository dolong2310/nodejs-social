import { Injectable } from '@/decorators/injectable.decorator';
import { BaseRepository } from '@/modules/base/base.repository';
import { BlockAlreadyExistsException } from '@/modules/blocks/blocks.exception';
import { BlockSchema } from '@/modules/blocks/blocks.schema';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { MongoServerError, ObjectId } from 'mongodb';

export interface IBlockRepository {
  isBlockedEitherWay(aUserId: string, bUserId: string): Promise<boolean>;
  listUserIdsBlockedInEitherDirection(viewerUserId: string): Promise<string[]>;
  createBlock(blockerUserId: string, blockedUserId: string): Promise<void>;
  deleteBlock(blockerUserId: string, blockedUserId: string): Promise<number>;
  listBlockedUserIdsForBlocker(blockerUserId: string): Promise<string[]>;
}

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

@Injectable()
export class BlockRepository extends BaseRepository implements IBlockRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async isBlockedEitherWay(aUserId: string, bUserId: string): Promise<boolean> {
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
  async listUserIdsBlockedInEitherDirection(viewerUserId: string): Promise<string[]> {
    const viewerId = new ObjectId(viewerUserId);
    const [asBlocker, asBlocked] = await Promise.all([
      this.db.blocks.distinct('blockedId', { blockerId: viewerId }),
      this.db.blocks.distinct('blockerId', { blockedId: viewerId })
    ]);
    const ids = [...asBlocker, ...asBlocked].map((id) => id.toString());
    return dedupeIds(ids);
  }

  async createBlock(blockerUserId: string, blockedUserId: string): Promise<void> {
    try {
      const doc = new BlockSchema({
        blockerId: new ObjectId(blockerUserId),
        blockedId: new ObjectId(blockedUserId)
      });
      await this.db.blocks.insertOne(doc);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw BlockAlreadyExistsException;
      }
      throw error;
    }
  }

  async deleteBlock(blockerUserId: string, blockedUserId: string): Promise<number> {
    const result = await this.db.blocks.deleteOne({
      blockerId: new ObjectId(blockerUserId),
      blockedId: new ObjectId(blockedUserId)
    });
    return result.deletedCount;
  }

  async listBlockedUserIdsForBlocker(blockerUserId: string): Promise<string[]> {
    const ids = await this.db.blocks.distinct('blockedId', { blockerId: new ObjectId(blockerUserId) });
    return ids.map((id) => id.toString());
  }
}
