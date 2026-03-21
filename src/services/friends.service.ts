import { CACHE_KEYS, CACHE_TTL } from '@/constants/cache.constant';
import { IRedisService } from '@/database/redis/redis.service';
import type { IFriendshipRepository } from '@/repositories/friendship.repository';
import { BaseService } from '@/services/base.service';
import { ObjectId } from 'mongodb';

export interface IFriendsService {
  findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  isFriendOf(viewerUserId: string, otherUserId: string): Promise<boolean>;
  invalidateFriendCache(userId: string): Promise<void>;
}

class FriendsService extends BaseService implements IFriendsService {
  constructor(
    private readonly friendshipRepository: IFriendshipRepository,
    private readonly redisService: IRedisService
  ) {
    super();
  }

  async findFollowedUserIds(userId: string): Promise<ObjectId[]> {
    const cached = await this.redisService.get<string[]>(CACHE_KEYS.friends(userId));
    if (cached !== null) {
      return cached.map((id) => new ObjectId(id));
    }

    const friendIds = await this.friendshipRepository.findFriendUserIdsForUser(new ObjectId(userId));
    await this.redisService.set(
      CACHE_KEYS.friends(userId),
      friendIds.map((id) => id.toString()),
      CACHE_TTL.FRIENDS_GRAPH
    );

    return friendIds;
  }

  async isFriendOf(viewerUserId: string, otherUserId: string): Promise<boolean> {
    const pair = await this.friendshipRepository.findFriendshipPair(
      new ObjectId(viewerUserId),
      new ObjectId(otherUserId)
    );
    return pair !== null;
  }

  async invalidateFriendCache(userId: string): Promise<void> {
    await this.redisService.del(CACHE_KEYS.friends(userId));
  }
}

export default FriendsService;
