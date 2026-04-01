/*
 * FriendshipRepository — undirected friend edges (normalized userIdLow/userIdHigh).
 */

import { Injectable } from '@/decorators/injectable.decorator';
import { BaseRepository } from '@/modules/base/base.repository';
import { FriendshipPairRequiresDistinctUserIdsException } from '@/modules/friends/friends.exception';
import { FriendshipSchema, IFriendship } from '@/modules/friends/friendship.schema';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { ObjectId } from 'mongodb';

export interface IFriendshipRepository {
  findFriendUserIdsForUser(userId: string): Promise<string[]>;
  listFriendUserIdsForUserByCursor(userId: string, limit: number, cursor?: string): Promise<string[]>;
  findFriendshipPair(userIdA: string, userIdB: string): Promise<IFriendship | null>;
  /** Count undirected friend edges between `userId` and any id in `otherUserIds` (distinct peers). */
  countFriendshipsWithUserAmongOthers(userId: string, otherUserIds: string[]): Promise<number>;
  insertFriendship(userIdA: string, userIdB: string): Promise<void>;
  deleteFriendshipPair(userIdA: string, userIdB: string): Promise<number>;
}

/**
 * Map two user ids to canonical storage order (D-04).
 * Ordering uses BSON ObjectId byte order (`Buffer.compare(a.id, b.id)`), not string `localeCompare`.
 */
export function normalizeFriendshipPair(a: ObjectId, b: ObjectId): { userIdLow: ObjectId; userIdHigh: ObjectId } {
  const cmp = Buffer.compare(a.id, b.id);
  if (cmp === 0) {
    throw FriendshipPairRequiresDistinctUserIdsException;
  }
  return cmp < 0 ? { userIdLow: a, userIdHigh: b } : { userIdLow: b, userIdHigh: a };
}

@Injectable()
export class FriendshipRepository extends BaseRepository implements IFriendshipRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async findFriendUserIdsForUser(userId: string): Promise<string[]> {
    const oid = new ObjectId(userId);
    const col = this.db.friendships;
    const [asLow, asHigh] = await Promise.all([
      col.find({ userIdLow: oid }).project({ userIdHigh: 1, _id: 0 }).toArray(),
      col.find({ userIdHigh: oid }).project({ userIdLow: 1, _id: 0 }).toArray()
    ]);
    const fromLow = asLow.map((d) => d.userIdHigh).filter(Boolean) as ObjectId[];
    const fromHigh = asHigh.map((d) => d.userIdLow).filter(Boolean) as ObjectId[];
    return [...fromLow, ...fromHigh].map((id) => id.toHexString());
  }

  async findFriendshipPair(userIdA: string, userIdB: string): Promise<IFriendship | null> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(new ObjectId(userIdA), new ObjectId(userIdB));
    return this.db.friendships.findOne<IFriendship>({ userIdLow, userIdHigh });
  }

  async listFriendUserIdsForUserByCursor(userId: string, limit: number, cursor?: string): Promise<string[]> {
    const oid = new ObjectId(userId);
    const cursorOid = cursor ? new ObjectId(cursor) : undefined;
    const pipeline = [
      {
        $match: {
          $or: [{ userIdLow: oid }, { userIdHigh: oid }]
        }
      },
      {
        $project: {
          _id: 0,
          friendId: { $cond: [{ $eq: ['$userIdLow', oid] }, '$userIdHigh', '$userIdLow'] }
        }
      },
      ...(cursorOid ? [{ $match: { friendId: { $gt: cursorOid } } }] : []),
      { $sort: { friendId: 1 as const } },
      { $limit: limit }
    ];

    const rows = await this.db.friendships.aggregate<{ friendId: ObjectId }>(pipeline).toArray();
    return rows.map((row) => row.friendId.toHexString());
  }

  /**
   * - Đếm số lượng mối quan hệ bạn bè giữa tất cả các member trong group với admin.
   * - Nghĩa là nó đang lấy tất cả số lượng member trong group là bạn bè của admin và so sánh với số lượng member trong group (trừ admin ra) phải bằng nhau.
   */
  async countFriendshipsWithUserAmongOthers(userId: string, otherUserIds: string[]): Promise<number> {
    if (otherUserIds.length === 0) {
      return 0;
    }
    const userOid = new ObjectId(userId);
    const others = otherUserIds.map((id) => new ObjectId(id));
    return this.db.friendships.countDocuments({
      $or: [
        { userIdLow: userOid, userIdHigh: { $in: others } },
        { userIdHigh: userOid, userIdLow: { $in: others } }
      ]
    });
  }

  async insertFriendship(userIdA: string, userIdB: string): Promise<void> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(new ObjectId(userIdA), new ObjectId(userIdB));
    const doc = new FriendshipSchema({ userIdLow, userIdHigh, createdAt: new Date() });
    await this.db.friendships.insertOne(doc);
  }

  async deleteFriendshipPair(userIdA: string, userIdB: string): Promise<number> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(new ObjectId(userIdA), new ObjectId(userIdB));
    const result = await this.db.friendships.deleteOne({ userIdLow, userIdHigh });
    return result.deletedCount;
  }
}
