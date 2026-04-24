import { LoggerPort } from '@/application/ports/logger.port';
import { FriendRequestEntity } from '@/domain/entities/friend-request/friend-request.entity';
import { FriendRequestRepositoryPort } from '@/domain/repositories/friend-request/friend-request.repository';
import {
  ICountOutgoingRequestsCreatedOnUtcDayInput,
  ICreatePendingRequestInput,
  IDeleteAllRequestsBetweenUsersInput,
  IDeletePendingRequestInput,
  IFindPendingRequestByUserPairInput,
  IListIncomingForUserInput,
  IListOutgoingForUserInput
} from '@/domain/repositories/friend-request/friend-request.repository.type';
import { MongoRepositoryBase } from '@/infrastructure/persistence/repositories/base/base.mongo.repository';
import { FriendRequestMapper } from '@/infrastructure/persistence/repositories/friend-request/friend-request.mapper';
import { FriendRequestModel } from '@/infrastructure/persistence/repositories/friend-request/friend-request.model';
import { Db, MongoClient, MongoServerError } from 'mongodb';

export class FriendRequestRepository
  extends MongoRepositoryBase<FriendRequestEntity, FriendRequestModel>
  implements FriendRequestRepositoryPort
{
  protected collectionName = 'friendRequests';

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
  }: IFindPendingRequestByUserPairInput): Promise<FriendRequestEntity | null> {
    const record = await this.dbCollection.findOne({
      fromUserId,
      toUserId
    });
    return record ? this.mapper.toDomain(record) : null;
  }

  async listIncomingForUser({ toUserId, limit, cursor }: IListIncomingForUserInput): Promise<FriendRequestEntity[]> {
    const filter: Record<string, unknown> = { toUserId };
    if (cursor) {
      filter.$or = [
        { createdAt: { $lt: cursor.raw().createdAt } },
        { createdAt: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
      ];
    }
    const results = await this.dbCollection.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();
    const result = results.map((record) => this.mapper.toDomain(record));
    return result;
  }

  async listOutgoingForUser({ fromUserId, limit, cursor }: IListOutgoingForUserInput): Promise<FriendRequestEntity[]> {
    const filter: Record<string, unknown> = { fromUserId };
    if (cursor) {
      filter.$or = [
        { createdAt: { $lt: cursor.raw().createdAt } },
        { createdAt: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
      ];
    }
    const results = await this.dbCollection.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();
    const result = results.map((record) => this.mapper.toDomain(record));
    return result;
  }

  async createPendingRequest({ fromUserId, toUserId }: ICreatePendingRequestInput): Promise<FriendRequestEntity> {
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

  async deletePendingRequest({ fromUserId, toUserId }: IDeletePendingRequestInput): Promise<number> {
    const result = await this.dbCollection.deleteOne({
      fromUserId,
      toUserId
    });
    return result.deletedCount;
  }

  /**
   * Remove any pending request between the two users (both directions).
   */
  async deleteAllRequestsBetweenUsers({ fromUserId, toUserId }: IDeleteAllRequestsBetweenUsersInput): Promise<void> {
    await this.dbCollection.deleteMany({
      $or: [
        { fromUserId: fromUserId, toUserId: toUserId },
        { fromUserId: toUserId, toUserId: fromUserId }
      ]
    });
  }

  async countOutgoingRequestsCreatedOnUtcDay({
    fromUserId,
    dayStart,
    dayEndExclusive
  }: ICountOutgoingRequestsCreatedOnUtcDayInput): Promise<number> {
    const result = await this.dbCollection.countDocuments({
      fromUserId,
      createdAt: { $gte: dayStart, $lt: dayEndExclusive }
    });
    return result;
  }
}
