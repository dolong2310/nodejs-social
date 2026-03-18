import FollowerSchema from '@/models/schemas/follower.schema';
import { DatabaseSingleton } from '@/services/database.singleton';
import { FindOptions, ObjectId } from 'mongodb';

class FollowersService {
  constructor() {}

  private get db() {
    return DatabaseSingleton.get();
  }

  async findFollowedUserIds(userId: string) {
    const objectFollowedUserIds = await this.db.followers
      .find({ userId: new ObjectId(userId) })
      .project({ _id: 0, followedUserId: 1 })
      .toArray();
    const followedUserIds: ObjectId[] = objectFollowedUserIds.map((item) => item.followedUserId);
    return followedUserIds;
  }

  findFollower({ myUserId, followedUserId }: { myUserId: string; followedUserId: string }, options?: FindOptions) {
    return this.db.followers.findOne(
      {
        userId: new ObjectId(myUserId),
        followedUserId: new ObjectId(followedUserId)
      },
      options
    );
  }

  followUser({ myUserId, followedUserId }: { myUserId: string; followedUserId: string }) {
    return this.db.followers.insertOne(
      new FollowerSchema({
        userId: new ObjectId(myUserId),
        followedUserId: new ObjectId(followedUserId)
      })
    );
  }

  unfollowUser({ myUserId, unfollowedUserId }: { myUserId: string; unfollowedUserId: string }) {
    return this.db.followers.deleteOne({
      userId: new ObjectId(myUserId),
      followedUserId: new ObjectId(unfollowedUserId)
    });
  }
}

export default new FollowersService();
