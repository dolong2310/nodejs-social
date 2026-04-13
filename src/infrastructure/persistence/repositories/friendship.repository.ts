import { FriendshipEntity, IFriendship } from '@/domain/entities/friendship.entity';
import {
  ICountFriendshipsWithUserAmongOthersInput,
  ICreateFriendshipInput,
  IDeleteFriendshipInput,
  IFindFriendIdsByUserIdInput,
  IFindFriendshipPairInput,
  IListFriendIdsByCursorInput
} from '@/domain/repositories/friendship/friendship.interface';
import { IFriendshipRepository } from '@/domain/repositories/friendship/friendship.repository';

import { FriendshipPairRequiresDistinctUserIdsException } from '@/application/errors/friend.error';

import { FriendshipMapper } from '@/infrastructure/persistence/mapper/friendship.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';

import { MongoServerError, ObjectId } from 'mongodb';

/**
 * Map two user ids to canonical storage order.
 * Ordering uses BSON ObjectId byte order (`Buffer.compare(a.id, b.id)`), not string `localeCompare`.
 */
export function normalizeFriendshipPair(a: ObjectId, b: ObjectId): { userIdLow: ObjectId; userIdHigh: ObjectId } {
  const cmp = Buffer.compare(a.id, b.id);
  if (cmp === 0) {
    throw FriendshipPairRequiresDistinctUserIdsException;
  }
  return cmp < 0 ? { userIdLow: a, userIdHigh: b } : { userIdLow: b, userIdHigh: a };
}

export class FriendshipRepository extends BaseRepository implements IFriendshipRepository {
  constructor(
    db: DatabaseService,
    private readonly mapper: FriendshipMapper
  ) {
    super(db);
  }

  async findFriendIdsByUserId(data: IFindFriendIdsByUserIdInput): Promise<string[]> {
    const oid = new ObjectId(data.userId);
    const col = this.db.friendships;
    const [asLow, asHigh] = await Promise.all([
      col.find({ userIdLow: oid }).project({ userIdHigh: 1, _id: 0 }).toArray(),
      col.find({ userIdHigh: oid }).project({ userIdLow: 1, _id: 0 }).toArray()
    ]);
    const fromLow = asLow.map((d) => d.userIdHigh).filter(Boolean);
    const fromHigh = asHigh.map((d) => d.userIdLow).filter(Boolean);
    return [...fromLow, ...fromHigh].map((id) => id.toString());
  }

  async findFriendshipPair(data: IFindFriendshipPairInput): Promise<IFriendship | null> {
    const { aUserId, bUserId } = data;
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(new ObjectId(aUserId), new ObjectId(bUserId));
    const result = await this.db.friendships.findOne<IFriendship>({ userIdLow, userIdHigh });
    return result;
  }

  async listFriendIdsByCursor(data: IListFriendIdsByCursorInput): Promise<string[]> {
    const { userId, limit, cursor } = data;
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
    return rows.map((row) => row.friendId.toString());
  }

  async createFriendship(data: ICreateFriendshipInput): Promise<IFriendship | null> {
    try {
      const { aUserId, bUserId } = data;
      const { userIdLow, userIdHigh } = normalizeFriendshipPair(new ObjectId(aUserId), new ObjectId(bUserId));
      const doc = FriendshipEntity.create({
        id: '123',
        userIdLow: userIdLow.toString(),
        userIdHigh: userIdHigh.toString(),
        createdAt: new Date()
      });
      await this.db.friendships.insertOne(this.mapper.toPersistence(doc));
      return doc;
    } catch (error) {
      // có thể đụng unique index (Mongo error 11000) nếu friendship đã tồn tại do race condition.
      if (error instanceof MongoServerError && error.code === 11000) {
        return null;
      }
      throw error;
    }
  }

  async deleteFriendship(data: IDeleteFriendshipInput): Promise<number> {
    const { aUserId, bUserId } = data;
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(new ObjectId(aUserId), new ObjectId(bUserId));
    const result = await this.db.friendships.deleteOne({ userIdLow, userIdHigh });
    return result.deletedCount;
  }

  /**
   * - Đếm số lượng mối quan hệ bạn bè giữa tất cả các member trong group với admin.
   * - Nghĩa là nó đang lấy tất cả số lượng member trong group là bạn bè của admin và so sánh với số lượng member trong group (trừ admin ra) phải bằng nhau.
   */
  async countFriendshipsWithUserAmongOthers(data: ICountFriendshipsWithUserAmongOthersInput): Promise<number> {
    const { userId, otherUserIds } = data;
    if (otherUserIds.length === 0) {
      return 0;
    }
    const userOid = new ObjectId(userId);
    const others = otherUserIds.map((id) => new ObjectId(id));
    const result = await this.db.friendships.countDocuments({
      $or: [
        { userIdLow: userOid, userIdHigh: { $in: others } },
        { userIdHigh: userOid, userIdLow: { $in: others } }
      ]
    });
    return result;
  }
}
