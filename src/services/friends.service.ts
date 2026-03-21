import { CACHE_KEYS, CACHE_TTL } from '@/constants/cache.constant';
import { IRedisService } from '@/database/redis/redis.service';
import { IFriendRequest } from '@/models/schemas/friendRequest.schema';
import type { IFriendshipRepository } from '@/repositories/friendship.repository';
import { BaseService } from '@/services/base.service';
import { ObjectId } from 'mongodb';

/** User fields returned in friend / pending-request lists. */
export interface FriendUserRow {
  _id: ObjectId;
  name: string;
  username?: string;
  avatar?: string;
}

export interface IFriendsService {
  findFollowedUserIds(userId: string): Promise<ObjectId[]>;
  isFriendOf(viewerUserId: string, otherUserId: string): Promise<boolean>;
  invalidateFriendCache(userId: string): Promise<void>;
  sendFriendRequest(myUserId: string, toUserId: string): Promise<IFriendRequest>;
  acceptIncomingRequest(myUserId: string, fromUserId: string): Promise<void>;
  declineIncomingRequest(myUserId: string, fromUserId: string): Promise<void>;
  revokeOutgoingRequest(myUserId: string, toUserId: string): Promise<void>;
  unfriend(myUserId: string, otherUserId: string): Promise<void>;
  listFriends(
    myUserId: string,
    page: string,
    limit: string
  ): Promise<{ users: FriendUserRow[]; total: number }>;
  listIncomingRequests(
    myUserId: string,
    page: string,
    limit: string
  ): Promise<{ users: FriendUserRow[]; total: number }>;
  listOutgoingRequests(
    myUserId: string,
    page: string,
    limit: string
  ): Promise<{ users: FriendUserRow[]; total: number }>;
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

  // --- Stub implementations; replaced in plan task 2 ---
  async sendFriendRequest(_myUserId: string, _toUserId: string): Promise<IFriendRequest> {
    throw new Error('FriendsService.sendFriendRequest: not implemented (task 2)');
  }

  async acceptIncomingRequest(_myUserId: string, _fromUserId: string): Promise<void> {
    throw new Error('FriendsService.acceptIncomingRequest: not implemented (task 2)');
  }

  async declineIncomingRequest(_myUserId: string, _fromUserId: string): Promise<void> {
    throw new Error('FriendsService.declineIncomingRequest: not implemented (task 2)');
  }

  async revokeOutgoingRequest(_myUserId: string, _toUserId: string): Promise<void> {
    throw new Error('FriendsService.revokeOutgoingRequest: not implemented (task 2)');
  }

  async unfriend(_myUserId: string, _otherUserId: string): Promise<void> {
    throw new Error('FriendsService.unfriend: not implemented (task 2)');
  }

  async listFriends(_myUserId: string, _page: string, _limit: string): Promise<{ users: FriendUserRow[]; total: number }> {
    throw new Error('FriendsService.listFriends: not implemented (task 2)');
  }

  async listIncomingRequests(
    _myUserId: string,
    _page: string,
    _limit: string
  ): Promise<{ users: FriendUserRow[]; total: number }> {
    throw new Error('FriendsService.listIncomingRequests: not implemented (task 2)');
  }

  async listOutgoingRequests(
    _myUserId: string,
    _page: string,
    _limit: string
  ): Promise<{ users: FriendUserRow[]; total: number }> {
    throw new Error('FriendsService.listOutgoingRequests: not implemented (task 2)');
  }
}

export default FriendsService;
