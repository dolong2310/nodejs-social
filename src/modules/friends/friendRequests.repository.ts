/*
 * FriendRequestRepository — directed pending requests.
 */

import { Injectable } from '@/decorators';
import { BaseRepository, FriendRequestSchema, IFriendRequest } from '@/modules';
import { ObjectId } from 'mongodb';

export interface IFriendRequestRepository {
  countOutgoingRequestsCreatedOnUtcDay(fromUserId: string, dayStart: Date, dayEndExclusive: Date): Promise<number>;
  insertPendingRequest(fromUserId: string, toUserId: string): Promise<IFriendRequest>;
  deleteDirectedRequest(fromUserId: string, toUserId: string): Promise<number>;
  listIncomingForUser(
    toUserId: string,
    limit: number,
    cursor?: { createdAt: Date; _id: string }
  ): Promise<IFriendRequest[]>;
  listOutgoingForUser(
    fromUserId: string,
    limit: number,
    cursor?: { createdAt: Date; _id: string }
  ): Promise<IFriendRequest[]>;
  deleteAllRequestsInvolvingUsers(userA: string, userB: string): Promise<void>;
  findPendingByDirectedPair(fromUserId: string, toUserId: string): Promise<IFriendRequest | null>;
}

@Injectable()
export class FriendRequestRepository extends BaseRepository implements IFriendRequestRepository {
  async countOutgoingRequestsCreatedOnUtcDay(
    fromUserId: string,
    dayStart: Date,
    dayEndExclusive: Date
  ): Promise<number> {
    return this.db.friendRequests.countDocuments({
      fromUserId: new ObjectId(fromUserId),
      createdAt: { $gte: dayStart, $lt: dayEndExclusive }
    });
  }

  async insertPendingRequest(fromUserId: string, toUserId: string): Promise<IFriendRequest> {
    const doc = new FriendRequestSchema({
      fromUserId: new ObjectId(fromUserId),
      toUserId: new ObjectId(toUserId),
      createdAt: new Date()
    });
    await this.db.friendRequests.insertOne(doc);
    return doc;
  }

  async deleteDirectedRequest(fromUserId: string, toUserId: string): Promise<number> {
    const result = await this.db.friendRequests.deleteOne({
      fromUserId: new ObjectId(fromUserId),
      toUserId: new ObjectId(toUserId)
    });
    return result.deletedCount;
  }

  async listIncomingForUser(
    toUserId: string,
    limit: number,
    cursor?: { createdAt: Date; _id: string }
  ): Promise<IFriendRequest[]> {
    const toOid = new ObjectId(toUserId);
    const filter: Record<string, unknown> = { toUserId: toOid };
    if (cursor) {
      const cursorId = new ObjectId(cursor._id);
      filter.$or = [{ createdAt: { $lt: cursor.createdAt } }, { createdAt: cursor.createdAt, _id: { $lt: cursorId } }];
    }
    const items = await this.db.friendRequests.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();
    return items as IFriendRequest[];
  }

  async listOutgoingForUser(
    fromUserId: string,
    limit: number,
    cursor?: { createdAt: Date; _id: string }
  ): Promise<IFriendRequest[]> {
    const fromOid = new ObjectId(fromUserId);
    const filter: Record<string, unknown> = { fromUserId: fromOid };
    if (cursor) {
      const cursorId = new ObjectId(cursor._id);
      filter.$or = [{ createdAt: { $lt: cursor.createdAt } }, { createdAt: cursor.createdAt, _id: { $lt: cursorId } }];
    }
    const items = await this.db.friendRequests.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();
    return items as IFriendRequest[];
  }

  /**
   * Remove any pending request between the two users (both directions).
   */
  async deleteAllRequestsInvolvingUsers(userA: string, userB: string): Promise<void> {
    const a = new ObjectId(userA);
    const b = new ObjectId(userB);
    await this.db.friendRequests.deleteMany({
      $or: [
        { fromUserId: a, toUserId: b },
        { fromUserId: b, toUserId: a }
      ]
    });
  }

  findPendingByDirectedPair(fromUserId: string, toUserId: string): Promise<IFriendRequest | null> {
    return this.db.friendRequests.findOne({
      fromUserId: new ObjectId(fromUserId),
      toUserId: new ObjectId(toUserId)
    });
  }
}
