import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { FriendshipEntity } from '@/modules/relationship/domain/entities/friendship.entity';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';
import {
  CountFriendshipsWithUserAmongOthersInput,
  ListFriendIdsByCursorInput
} from '@/modules/relationship/domain/repositories/friendship.repository.type';
import { FriendshipMapper } from '@/modules/relationship/infrastructure/persistence/mongo/friendship.mapper';
import { FriendshipModel } from '@/modules/relationship/infrastructure/persistence/mongo/friendship.model';
import { Db, MongoClient, MongoServerError } from 'mongodb';

export class FriendshipRepository
  extends MongoRepositoryBase<FriendshipEntity, FriendshipModel>
  implements FriendshipRepositoryPort
{
  protected collectionName = 'friendships';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: FriendshipMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async findFriendIdsByUserId(userId: string): Promise<string[]> {
    const [asLow, asHigh] = await Promise.all([
      this.dbCollection.find({ user_id_low: userId }).project({ user_id_high: 1, _id: 0 }).toArray(),
      this.dbCollection.find({ user_id_high: userId }).project({ user_id_low: 1, _id: 0 }).toArray()
    ]);
    const fromLow = asLow.map((d) => d.user_id_high).filter(Boolean);
    const fromHigh = asHigh.map((d) => d.user_id_low).filter(Boolean);
    return [...fromLow, ...fromHigh].map((id) => id.toString());
  }

  async findFriendshipPair(userIdA: string, userIdB: string): Promise<FriendshipEntity | null> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(userIdA, userIdB);
    const record = await this.dbCollection.findOne({ user_id_low: userIdLow, user_id_high: userIdHigh });
    return record ? this.mapper.toDomain(record) : null;
  }

  async listFriendIdsByCursor({ userId, limit, cursor }: ListFriendIdsByCursorInput): Promise<string[]> {
    const pipeline = [
      {
        $match: {
          $or: [{ user_id_low: userId }, { user_id_high: userId }]
        }
      },
      {
        $project: {
          _id: 0,
          friendId: { $cond: [{ $eq: ['$user_id_low', userId] }, '$user_id_high', '$user_id_low'] }
        }
      },
      ...(cursor ? [{ $match: { friendId: { $gt: cursor } } }] : []),
      { $sort: { friendId: 1 as const } },
      { $limit: limit }
    ];

    const results = await this.dbCollection.aggregate<{ friendId: string }>(pipeline).toArray();
    return results.map((result) => result.friendId);
  }

  async createFriendship(userIdA: string, userIdB: string): Promise<FriendshipEntity | null> {
    try {
      const { userIdLow, userIdHigh } = normalizeFriendshipPair(userIdA, userIdB);
      const entity = FriendshipEntity.create({
        userIdLow,
        userIdHigh
      });
      const record = this.mapper.toPersistence(entity);
      await this.dbCollection.insertOne(record);
      return this.mapper.toDomain(record);
    } catch (error) {
      // có thể đụng unique index (Mongo error 11000) nếu friendship đã tồn tại do race condition.
      if (error instanceof MongoServerError && error.code === 11000) {
        return null;
      }
      throw error;
    }
  }

  async deleteFriendship(userIdA: string, userIdB: string): Promise<number> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(userIdA, userIdB);
    const result = await this.dbCollection.deleteOne({ user_id_low: userIdLow, user_id_high: userIdHigh });
    return result.deletedCount;
  }

  /**
   * - Đếm số lượng mối quan hệ bạn bè giữa tất cả các member trong group với admin.
   * - Nghĩa là nó đang lấy tất cả số lượng member trong group là bạn bè của admin và so sánh với số lượng member trong group (trừ admin ra) phải bằng nhau.
   */
  async countFriendshipsWithUserAmongOthers({
    userId,
    otherUserIds
  }: CountFriendshipsWithUserAmongOthersInput): Promise<number> {
    if (otherUserIds.length === 0) return 0;
    const result = await this.dbCollection.countDocuments({
      $or: [
        { user_id_low: userId, user_id_high: { $in: otherUserIds } },
        { user_id_high: userId, user_id_low: { $in: otherUserIds } }
      ]
    });
    return result;
  }
}

/**
 * Map two user ids to canonical storage order based on string comparison.
 */
export function normalizeFriendshipPair(a: string, b: string): { userIdLow: string; userIdHigh: string } {
  const cmp = a.localeCompare(b);
  if (cmp === 0) {
    throw new Error('Friendship pair requires two distinct user ids');
  }
  return cmp < 0 ? { userIdLow: a, userIdHigh: b } : { userIdLow: b, userIdHigh: a };
}
