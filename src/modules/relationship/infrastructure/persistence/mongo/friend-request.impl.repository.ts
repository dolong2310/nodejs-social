import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { FriendRequestEntity } from '@/modules/relationship/domain/entities/friend-request.entity';
import { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';
import {
  CountOutgoingRequestsCreatedOnUtcDayInput,
  CreatePendingRequestInput,
  DeleteAllRequestsBetweenUsersInput,
  DeletePendingRequestInput,
  FindPendingRequestByUserPairInput,
  ListIncomingForUserInput,
  ListOutgoingForUserInput
} from '@/modules/relationship/domain/repositories/friend-request.repository.type';
import { FriendRequestMapper } from '@/modules/relationship/infrastructure/persistence/mongo/friend-request.mapper';
import { FriendRequestModel } from '@/modules/relationship/infrastructure/persistence/mongo/friend-request.model';
import { Db, MongoClient, MongoServerError } from 'mongodb';

export class FriendRequestRepository
  extends MongoRepositoryBase<FriendRequestEntity, FriendRequestModel>
  implements FriendRequestRepositoryPort
{
  protected collectionName = 'friend_requests';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: FriendRequestMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async findPendingRequestByUserPair({
    fromUserId,
    toUserId
  }: FindPendingRequestByUserPairInput): Promise<FriendRequestEntity | null> {
    const record = await this.dbCollection.findOne({
      from_user_id: fromUserId,
      to_user_id: toUserId
    });
    return record ? this.mapper.toDomain(record) : null;
  }

  async listIncomingForUser({ toUserId, limit, cursor }: ListIncomingForUserInput): Promise<FriendRequestEntity[]> {
    const filter: Record<string, unknown> = { to_user_id: toUserId };
    if (cursor) {
      filter.$or = [
        { created_at: { $lt: cursor.raw().createdAt } },
        { created_at: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
      ];
    }
    const results = await this.dbCollection.find(filter).sort({ created_at: -1, _id: -1 }).limit(limit).toArray();
    const result = results.map((record) => this.mapper.toDomain(record));
    return result;
  }

  async listOutgoingForUser({ fromUserId, limit, cursor }: ListOutgoingForUserInput): Promise<FriendRequestEntity[]> {
    const filter: Record<string, unknown> = { from_user_id: fromUserId };
    if (cursor) {
      filter.$or = [
        { created_at: { $lt: cursor.raw().createdAt } },
        { created_at: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
      ];
    }
    const results = await this.dbCollection.find(filter).sort({ created_at: -1, _id: -1 }).limit(limit).toArray();
    const result = results.map((record) => this.mapper.toDomain(record));
    return result;
  }

  async createPendingRequest({ fromUserId, toUserId }: CreatePendingRequestInput): Promise<FriendRequestEntity> {
    try {
      const entity = FriendRequestEntity.create({
        fromUserId,
        toUserId
      });
      const record = this.mapper.toPersistence(entity);
      await this.dbCollection.insertOne(record);
      return this.mapper.toDomain(record);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw error.message; // TODO: 'A friend request is already pending for this pair'
      }
      throw error;
    }
  }

  async deletePendingRequest({ fromUserId, toUserId }: DeletePendingRequestInput): Promise<number> {
    const result = await this.dbCollection.deleteOne({
      from_user_id: fromUserId,
      to_user_id: toUserId
    });
    return result.deletedCount;
  }

  /**
   * Remove any pending request between the two users (both directions).
   */
  async deleteAllRequestsBetweenUsers({ fromUserId, toUserId }: DeleteAllRequestsBetweenUsersInput): Promise<void> {
    await this.dbCollection.deleteMany({
      $or: [
        { from_user_id: fromUserId, to_user_id: toUserId },
        { from_user_id: toUserId, to_user_id: fromUserId }
      ]
    });
  }

  async countOutgoingRequestsCreatedOnUtcDay({
    fromUserId,
    dayStart,
    dayEndExclusive
  }: CountOutgoingRequestsCreatedOnUtcDayInput): Promise<number> {
    const result = await this.dbCollection.countDocuments({
      from_user_id: fromUserId,
      created_at: { $gte: dayStart, $lt: dayEndExclusive }
    });
    return result;
  }
}
