import { IFollowUserRequestBody, IUnfollowUserRequestParams } from '@/models/requests/follower.request';
import { IFollower } from '@/models/schemas/follower.schema';
import { IFollowerRepository } from '@/repositories/follower.repository';
import { BaseService } from '@/services/base.service';
import { ObjectId } from 'mongodb';

export interface IFollowersService {
  findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  findFollowerId(
    payload: (IFollowUserRequestBody | IUnfollowUserRequestParams) & { myUserId: string }
  ): Promise<Pick<IFollower, '_id'> | null>;
  followUser(payload: IFollowUserRequestBody & { myUserId: string }): Promise<IFollower>;
  unfollowUser(payload: IUnfollowUserRequestParams & { myUserId: string }): Promise<boolean>;
}

class FollowersService extends BaseService implements IFollowersService {
  constructor(private readonly followerRepository: IFollowerRepository) {
    super();
  }

  async findFollowedUserIds(userId: string): Promise<ObjectId[]> {
    const followedUsers = await this.followerRepository.findFollowedUser(userId);
    const followedUserIds: ObjectId[] = followedUsers.map((item) => item.followedUserId);
    return followedUserIds;
  }

  findFollowerId({
    myUserId,
    userId
  }: (IFollowUserRequestBody | IUnfollowUserRequestParams) & { myUserId: string }): Promise<Pick<
    IFollower,
    '_id'
  > | null> {
    return this.followerRepository.findOne({ myUserId, followedUserId: userId }, { projection: { _id: 1 } });
  }

  followUser({ myUserId, userId }: IFollowUserRequestBody & { myUserId: string }): Promise<IFollower> {
    return this.followerRepository.followUser({ myUserId, followedUserId: userId });
  }

  unfollowUser({ myUserId, userId }: IUnfollowUserRequestParams & { myUserId: string }): Promise<boolean> {
    return this.followerRepository.unfollowUser({ myUserId, unfollowedUserId: userId });
  }
}

export default FollowersService;
