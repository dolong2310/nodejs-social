import { FriendRequestEntity, IFriendRequest } from '@/domain/entities/friend-request.entity';
import {
  ICountOutgoingRequestsCreatedOnUtcDayInput,
  ICreatePendingRequestInput,
  IDeleteAllRequestsBetweenUsersInput,
  IDeletePendingRequestInput,
  IFindPendingRequestByUserPairInput,
  IListIncomingForUserInput,
  IListOutgoingForUserInput
} from '@/domain/repositories/friend-request/friend-request.interface';
import { IFriendRequestRepository } from '@/domain/repositories/friend-request/friend-request.repository';

import { FriendRequestAlreadyPendingException } from '@/application/errors/friend.error';

import { FriendRequestMapper } from '@/infrastructure/persistence/mapper/friend-request.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';

import { MongoServerError, ObjectId } from 'mongodb';

export class FriendRequestRepository extends BaseRepository implements IFriendRequestRepository {
  constructor(
    db: DatabaseService,
    private readonly mapper: FriendRequestMapper
  ) {
    super(db);
  }

  async findPendingRequestByUserPair(data: IFindPendingRequestByUserPairInput): Promise<IFriendRequest | null> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.friendRequests.findOne({
      fromUserId: record.fromUserId,
      toUserId: record.toUserId
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async listIncomingForUser(data: IListIncomingForUserInput): Promise<IFriendRequest[]> {
    const record = this.mapper.toPersistence(data);
    const filter: Record<string, unknown> = { toUserId: record.toUserId };
    if (data.cursor) {
      const cursorId = new ObjectId(data.cursor.id);
      filter.$or = [
        { createdAt: { $lt: data.cursor.createdAt } },
        { createdAt: data.cursor.createdAt, _id: { $lt: cursorId } }
      ];
    }
    const results = await this.db.friendRequests
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(data.limit)
      .toArray();

    const result = results.map((item) => this.mapper.toDomain(item));
    return result;
  }

  async listOutgoingForUser(data: IListOutgoingForUserInput): Promise<IFriendRequest[]> {
    const record = this.mapper.toPersistence(data);
    const filter: Record<string, unknown> = { fromUserId: record.fromUserId };
    if (data.cursor) {
      const cursorId = new ObjectId(data.cursor.id);
      filter.$or = [
        { createdAt: { $lt: data.cursor.createdAt } },
        { createdAt: data.cursor.createdAt, _id: { $lt: cursorId } }
      ];
    }
    const results = await this.db.friendRequests
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(data.limit)
      .toArray();

    const result = results.map((item) => this.mapper.toDomain(item));
    return result;
  }

  async createPendingRequest(data: ICreatePendingRequestInput): Promise<IFriendRequest> {
    try {
      const doc = FriendRequestEntity.create({
        id: '123',
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        createdAt: new Date()
      });
      await this.db.friendRequests.insertOne(this.mapper.toPersistence(doc));
      return doc;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw FriendRequestAlreadyPendingException;
      }
      throw error;
    }
  }

  async deletePendingRequest(data: IDeletePendingRequestInput): Promise<number> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.friendRequests.deleteOne({
      fromUserId: record.fromUserId,
      toUserId: record.toUserId
    });
    return result.deletedCount;
  }

  /**
   * Remove any pending request between the two users (both directions).
   */
  async deleteAllRequestsBetweenUsers(data: IDeleteAllRequestsBetweenUsersInput): Promise<void> {
    const record = this.mapper.toPersistence(data);
    await this.db.friendRequests.deleteMany({
      $or: [
        { fromUserId: record.fromUserId, toUserId: record.toUserId },
        { fromUserId: record.toUserId, toUserId: record.fromUserId }
      ]
    });
  }

  async countOutgoingRequestsCreatedOnUtcDay(data: ICountOutgoingRequestsCreatedOnUtcDayInput): Promise<number> {
    const { dayStart, dayEndExclusive } = data;
    const record = this.mapper.toPersistence(data);
    const result = await this.db.friendRequests.countDocuments({
      fromUserId: record.fromUserId,
      createdAt: { $gte: dayStart, $lt: dayEndExclusive }
    });
    return result;
  }
}
