/*
 * Follower Repository
 * This file contains the FollowerRepository class which implements IFollowerRepository interface.
 * It provides methods to interact with the follower data in the database.
 */

import FollowerSchema, { IFollower } from '@/models/schemas/follower.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { FindOptions, ObjectId } from 'mongodb';

export interface IFollowerRepository {
  findFollowedUser(userId: string): Promise<IFollower[]>;
  findOne(payload: { myUserId: string; followedUserId: string }, options?: FindOptions): Promise<IFollower | null>;
  followUser(payload: { myUserId: string; followedUserId: string }): Promise<IFollower>;
  unfollowUser(payload: { myUserId: string; unfollowedUserId: string }): Promise<boolean>;
}

export class FollowerRepository extends BaseRepository implements IFollowerRepository {
  async findFollowedUser(userId: string): Promise<IFollower[]> {
    const results = await this.db.followers
      .find({ userId: new ObjectId(userId) })
      .project({ _id: 0, followedUserId: 1 })
      .toArray();
    return results as IFollower[];
  }

  findOne(
    { myUserId, followedUserId }: { myUserId: string; followedUserId: string },
    options?: FindOptions
  ): Promise<IFollower | null> {
    return this.db.followers.findOne(
      {
        userId: new ObjectId(myUserId),
        followedUserId: new ObjectId(followedUserId)
      },
      options
    );
  }

  async followUser({ myUserId, followedUserId }: { myUserId: string; followedUserId: string }) {
    const newFollower = new FollowerSchema({
      userId: new ObjectId(myUserId),
      followedUserId: new ObjectId(followedUserId)
    });
    await this.db.followers.insertOne(newFollower);
    return newFollower;
  }

  async unfollowUser({ myUserId, unfollowedUserId }: { myUserId: string; unfollowedUserId: string }): Promise<boolean> {
    const result = await this.db.followers.deleteOne({
      userId: new ObjectId(myUserId),
      followedUserId: new ObjectId(unfollowedUserId)
    });
    return result.deletedCount > 0;
  }
}
