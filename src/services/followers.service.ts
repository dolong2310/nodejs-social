import { IFollower } from '@/models/schemas/follower.schema';
import { IFollowerRepository } from '@/repositories/follower.repository';
import { ObjectId } from 'mongodb';

export interface IFollowersService {
  findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  findFollowerId(payload: { myUserId: string; followedUserId: string }): Promise<IFollower | null>;
  followUser(payload: { myUserId: string; followedUserId: string }): Promise<IFollower>;
  unfollowUser(payload: { myUserId: string; unfollowedUserId: string }): Promise<boolean>;
}

class FollowersService implements IFollowersService {
  constructor(private readonly followerRepository: IFollowerRepository) {}

  async findFollowedUserIds(userId: string) {
    const followedUsers = await this.followerRepository.findFollowedUser(userId);
    const followedUserIds: ObjectId[] = followedUsers.map((item) => item.followedUserId);
    return followedUserIds;
  }

  findFollowerId(payload: { myUserId: string; followedUserId: string }) {
    return this.followerRepository.findOne(payload, { projection: { _id: 1 } });
  }

  followUser(payload: { myUserId: string; followedUserId: string }) {
    return this.followerRepository.followUser(payload);
  }

  unfollowUser(payload: { myUserId: string; unfollowedUserId: string }) {
    return this.followerRepository.unfollowUser(payload);
  }
}

export default FollowersService;
