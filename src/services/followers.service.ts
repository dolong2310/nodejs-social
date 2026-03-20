import { CACHE_KEYS, CACHE_TTL } from '@/constants/cache.constant';
import { IRedisService } from '@/database/redis/redis.service';
import { FollowUserRequestDTO, UnfollowUserParamsDTO } from '@/dtos/requests/follower.request.dto';
import { IFollower } from '@/models/schemas/follower.schema';
import { IFollowerRepository } from '@/repositories/follower.repository';
import { BaseService } from '@/services/base.service';
import { ObjectId } from 'mongodb';

export interface IFollowersService {
  findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  findFollowerId(
    payload: (FollowUserRequestDTO | UnfollowUserParamsDTO) & { myUserId: string }
  ): Promise<Pick<IFollower, '_id'> | null>;
  followUser(payload: FollowUserRequestDTO & { myUserId: string }): Promise<IFollower>;
  unfollowUser(payload: UnfollowUserParamsDTO & { myUserId: string }): Promise<boolean>;
}

class FollowersService extends BaseService implements IFollowersService {
  constructor(
    private readonly followerRepository: IFollowerRepository,
    private readonly redisService: IRedisService
  ) {
    super();
  }

  async findFollowedUserIds(userId: string): Promise<ObjectId[]> {
    const cached = await this.redisService.get<string[]>(CACHE_KEYS.followers(userId));
    if (cached !== null) {
      return cached.map((id) => new ObjectId(id));
    }

    const followedUsers = await this.followerRepository.findFollowedUser(userId);
    const followedUserIds = followedUsers.map((item) => item.followedUserId);

    await this.redisService.set(
      CACHE_KEYS.followers(userId),
      followedUserIds.map((id) => id.toString()),
      CACHE_TTL.FOLLOWERS
    );

    return followedUserIds;
  }

  findFollowerId({
    myUserId,
    userId
  }: (FollowUserRequestDTO | UnfollowUserParamsDTO) & { myUserId: string }): Promise<Pick<IFollower, '_id'> | null> {
    return this.followerRepository.findOne<Pick<IFollower, '_id'>>(
      { myUserId, followedUserId: userId },
      { projection: { _id: 1 } }
    );
  }

  async followUser({ myUserId, userId }: FollowUserRequestDTO & { myUserId: string }): Promise<IFollower> {
    const result = await this.followerRepository.followUser({ myUserId, followedUserId: userId });
    await this.redisService.del(CACHE_KEYS.followers(myUserId));
    return result;
  }

  async unfollowUser({ myUserId, userId }: UnfollowUserParamsDTO & { myUserId: string }): Promise<boolean> {
    const result = await this.followerRepository.unfollowUser({ myUserId, unfollowedUserId: userId });
    await this.redisService.del(CACHE_KEYS.followers(myUserId));
    return result;
  }
}

export default FollowersService;
