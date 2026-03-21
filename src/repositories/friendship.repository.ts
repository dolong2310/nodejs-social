/*
 * FriendshipRepository — undirected friend edges (normalized userIdLow/userIdHigh).
 */

import FriendshipSchema, { IFriendship } from '@/models/schemas/friendship.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { ObjectId } from 'mongodb';

export interface IFriendshipRepository {
  findFriendUserIdsForUser(userId: ObjectId): Promise<ObjectId[]>;
  findFriendshipPair(userIdA: ObjectId, userIdB: ObjectId): Promise<IFriendship | null>;
  insertFriendship(userIdA: ObjectId, userIdB: ObjectId): Promise<void>;
  deleteFriendshipPair(userIdA: ObjectId, userIdB: ObjectId): Promise<number>;
}

/**
 * Map two user ids to canonical storage order (D-04).
 * Ordering uses BSON ObjectId byte order (`Buffer.compare(a.id, b.id)`), not string `localeCompare`.
 */
export function normalizeFriendshipPair(
  a: ObjectId,
  b: ObjectId
): { userIdLow: ObjectId; userIdHigh: ObjectId } {
  const cmp = Buffer.compare(a.id, b.id);
  if (cmp === 0) {
    throw new Error('friendship pair requires two distinct user ids');
  }
  return cmp < 0 ? { userIdLow: a, userIdHigh: b } : { userIdLow: b, userIdHigh: a };
}

export class FriendshipRepository extends BaseRepository implements IFriendshipRepository {
  async findFriendUserIdsForUser(userId: ObjectId): Promise<ObjectId[]> {
    const col = this.db.friendships;
    const [asLow, asHigh] = await Promise.all([
      col.find({ userIdLow: userId }).project({ userIdHigh: 1, _id: 0 }).toArray(),
      col.find({ userIdHigh: userId }).project({ userIdLow: 1, _id: 0 }).toArray()
    ]);
    const fromLow = asLow.map((d) => d.userIdHigh).filter(Boolean) as ObjectId[];
    const fromHigh = asHigh.map((d) => d.userIdLow).filter(Boolean) as ObjectId[];
    return [...fromLow, ...fromHigh];
  }

  async findFriendshipPair(userIdA: ObjectId, userIdB: ObjectId): Promise<IFriendship | null> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(userIdA, userIdB);
    return this.db.friendships.findOne<IFriendship>({ userIdLow, userIdHigh });
  }

  async insertFriendship(userIdA: ObjectId, userIdB: ObjectId): Promise<void> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(userIdA, userIdB);
    const doc = new FriendshipSchema({ userIdLow, userIdHigh, createdAt: new Date() });
    await this.db.friendships.insertOne(doc);
  }

  async deleteFriendshipPair(userIdA: ObjectId, userIdB: ObjectId): Promise<number> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(userIdA, userIdB);
    const result = await this.db.friendships.deleteOne({ userIdLow, userIdHigh });
    return result.deletedCount;
  }
}
