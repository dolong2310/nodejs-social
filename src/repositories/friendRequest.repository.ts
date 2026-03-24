/*
 * FriendRequestRepository — directed pending requests.
 */

import FriendRequestSchema, { IFriendRequest } from '@/models/friendRequest.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { ObjectId } from 'mongodb';

export class FriendRequestRepository extends BaseRepository {
  async countOutgoingRequestsCreatedOnUtcDay(
    fromUserId: ObjectId,
    dayStart: Date,
    dayEndExclusive: Date
  ): Promise<number> {
    return this.db.friendRequests.countDocuments({
      fromUserId,
      createdAt: { $gte: dayStart, $lt: dayEndExclusive }
    });
  }

  async insertPendingRequest(fromUserId: ObjectId, toUserId: ObjectId): Promise<IFriendRequest> {
    const doc = new FriendRequestSchema({ fromUserId, toUserId, createdAt: new Date() });
    await this.db.friendRequests.insertOne(doc);
    return doc;
  }

  async deleteDirectedRequest(fromUserId: ObjectId, toUserId: ObjectId): Promise<number> {
    const result = await this.db.friendRequests.deleteOne({ fromUserId, toUserId });
    return result.deletedCount;
  }

  async listIncomingForUser(
    toUserId: ObjectId,
    skip: number,
    limit: number
  ): Promise<{ items: IFriendRequest[]; total: number }> {
    const filter = { toUserId };
    const [total, items] = await Promise.all([
      this.db.friendRequests.countDocuments(filter),
      this.db.friendRequests.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
    ]);
    return { total, items: items as IFriendRequest[] };
  }

  async listOutgoingForUser(
    fromUserId: ObjectId,
    skip: number,
    limit: number
  ): Promise<{ items: IFriendRequest[]; total: number }> {
    const filter = { fromUserId };
    const [total, items] = await Promise.all([
      this.db.friendRequests.countDocuments(filter),
      this.db.friendRequests.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
    ]);
    return { total, items: items as IFriendRequest[] };
  }

  /**
   * Remove any pending request between the two users (both directions).
   */
  async deleteAllRequestsInvolvingUsers(userA: ObjectId, userB: ObjectId): Promise<void> {
    await this.db.friendRequests.deleteMany({
      $or: [
        { fromUserId: userA, toUserId: userB },
        { fromUserId: userB, toUserId: userA }
      ]
    });
  }

  findPendingByDirectedPair(fromUserId: ObjectId, toUserId: ObjectId): Promise<IFriendRequest | null> {
    return this.db.friendRequests.findOne({ fromUserId, toUserId });
  }
}
