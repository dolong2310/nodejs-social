/*
 * FriendRequestRepository — directed pending requests.
 */

import { IFriendRequest } from '@/models/schemas/friendRequest.schema';
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

  async deleteDirectedRequest(fromUserId: ObjectId, toUserId: ObjectId): Promise<void> {
    await this.db.friendRequests.deleteOne({ fromUserId, toUserId });
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

  findPendingByDirectedPair(
    fromUserId: ObjectId,
    toUserId: ObjectId
  ): Promise<IFriendRequest | null> {
    return this.db.friendRequests.findOne({ fromUserId, toUserId });
  }
}
