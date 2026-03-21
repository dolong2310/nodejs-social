/**
 * Friend-request **daily send cap** (FRND-05 / D-07) uses the **UTC calendar day**
 * (`Date.UTC` year/month/day at midnight, window length 86400000 ms), not the server's
 * local timezone and not per-user local timezones.
 */

import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { CACHE_KEYS, CACHE_TTL } from '@/constants/cache.constant';
import { IRedisService } from '@/database/redis/redis.service';
import { IUser } from '@/models/schemas/user.schema';
import { IFriendRequest } from '@/models/schemas/friendRequest.schema';
import { BlockRepository } from '@/repositories/block.repository';
import { FriendRequestRepository } from '@/repositories/friendRequest.repository';
import type { IFriendshipRepository } from '@/repositories/friendship.repository';
import { IUserRepository } from '@/repositories/user.repository';
import { BaseService } from '@/services/base.service';
import {
  BadRequestError,
  ConflictRequestError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError
} from '@/responses/error.response';
import { MongoServerError, ObjectId } from 'mongodb';

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
  private static readonly OUTGOING_REQUESTS_PER_UTC_DAY = 100;

  constructor(
    private readonly friendshipRepository: IFriendshipRepository,
    private readonly friendRequestRepository: FriendRequestRepository,
    private readonly blockRepository: BlockRepository,
    private readonly redisService: IRedisService,
    private readonly userRepository: IUserRepository
  ) {
    super();
  }

  private utcDayRange(now: Date): { start: Date; endExclusive: Date } {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    const start = new Date(Date.UTC(y, m, d));
    const endExclusive = new Date(start.getTime() + 86400000);
    return { start, endExclusive };
  }

  private parsePageLimit(page: string, limit: string): { pageNum: number; limitNum: number; skip: number } {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
  }

  private toFriendUserRow(user: IUser): FriendUserRow {
    return {
      _id: user._id,
      name: user.name,
      username: user.username,
      avatar: user.avatar
    };
  }

  private async invalidateBoth(userIdA: string, userIdB: string): Promise<void> {
    await Promise.all([this.invalidateFriendCache(userIdA), this.invalidateFriendCache(userIdB)]);
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

  async sendFriendRequest(myUserId: string, toUserId: string): Promise<IFriendRequest> {
    if (myUserId === toUserId) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CANNOT_SEND_FRIEND_REQUEST_TO_YOURSELF);
    }

    const fromOid = new ObjectId(myUserId);
    const toOid = new ObjectId(toUserId);

    const target = await this.userRepository.findById(toUserId);
    if (!target) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    if (await this.blockRepository.isBlockedEitherWay(fromOid, toOid)) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.FRIEND_ACTION_BLOCKED);
    }

    const existingFriendship = await this.friendshipRepository.findFriendshipPair(fromOid, toOid);
    if (existingFriendship) {
      throw new ConflictRequestError(VALIDATION_ERROR_MESSAGE.ALREADY_FRIENDS);
    }

    const { start, endExclusive } = this.utcDayRange(new Date());
    const sentToday = await this.friendRequestRepository.countOutgoingRequestsCreatedOnUtcDay(
      fromOid,
      start,
      endExclusive
    );
    if (sentToday >= FriendsService.OUTGOING_REQUESTS_PER_UTC_DAY) {
      throw new TooManyRequestsError(VALIDATION_ERROR_MESSAGE.FRIEND_REQUEST_DAILY_LIMIT_EXCEEDED);
    }

    // Product: inverse pending (B→A) does not block sending (A→B); unique index is on the directed pair only.
    try {
      const created = await this.friendRequestRepository.insertPendingRequest(fromOid, toOid);
      await this.invalidateFriendCache(myUserId);
      return created;
    } catch (e) {
      if (e instanceof MongoServerError && e.code === 11000) {
        throw new ConflictRequestError(VALIDATION_ERROR_MESSAGE.FRIEND_REQUEST_ALREADY_PENDING);
      }
      throw e;
    }
  }

  async acceptIncomingRequest(myUserId: string, fromUserId: string): Promise<void> {
    const myOid = new ObjectId(myUserId);
    const fromOid = new ObjectId(fromUserId);

    const pending = await this.friendRequestRepository.findPendingByDirectedPair(fromOid, myOid);
    if (!pending) {
      const alreadyFriends = await this.friendshipRepository.findFriendshipPair(fromOid, myOid);
      if (alreadyFriends) {
        return;
      }
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.NO_PENDING_FRIEND_REQUEST);
    }

    if (await this.blockRepository.isBlockedEitherWay(myOid, fromOid)) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.FRIEND_ACTION_BLOCKED);
    }

    try {
      await this.friendshipRepository.insertFriendship(fromOid, myOid);
    } catch (e) {
      if (e instanceof MongoServerError && e.code === 11000) {
        await this.friendRequestRepository.deleteDirectedRequest(fromOid, myOid);
        await this.invalidateBoth(myUserId, fromUserId);
        return;
      }
      throw e;
    }

    await this.friendRequestRepository.deleteDirectedRequest(fromOid, myOid);
    await this.invalidateBoth(myUserId, fromUserId);
  }

  async declineIncomingRequest(myUserId: string, fromUserId: string): Promise<void> {
    const myOid = new ObjectId(myUserId);
    const fromOid = new ObjectId(fromUserId);
    const deleted = await this.friendRequestRepository.deleteDirectedRequest(fromOid, myOid);
    if (deleted === 0) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.NO_PENDING_FRIEND_REQUEST);
    }
    await this.invalidateBoth(myUserId, fromUserId);
  }

  async revokeOutgoingRequest(myUserId: string, toUserId: string): Promise<void> {
    const myOid = new ObjectId(myUserId);
    const toOid = new ObjectId(toUserId);
    const deleted = await this.friendRequestRepository.deleteDirectedRequest(myOid, toOid);
    if (deleted === 0) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.NO_PENDING_FRIEND_REQUEST);
    }
    await this.invalidateBoth(myUserId, toUserId);
  }

  async unfriend(myUserId: string, otherUserId: string): Promise<void> {
    const myOid = new ObjectId(myUserId);
    const otherOid = new ObjectId(otherUserId);
    const deleted = await this.friendshipRepository.deleteFriendshipPair(myOid, otherOid);
    if (deleted === 0) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.NO_FRIENDSHIP_WITH_USER);
    }
    await this.invalidateBoth(myUserId, otherUserId);
  }

  async listFriends(
    myUserId: string,
    page: string,
    limit: string
  ): Promise<{ users: FriendUserRow[]; total: number }> {
    const myOid = new ObjectId(myUserId);
    const friendOids = await this.friendshipRepository.findFriendUserIdsForUser(myOid);
    const sorted = [...friendOids].sort((a, b) => Buffer.compare(a.id, b.id));
    const total = sorted.length;
    const { skip, limitNum } = this.parsePageLimit(page, limit);
    const pageOids = sorted.slice(skip, skip + limitNum);
    const idStrings = pageOids.map((o) => o.toHexString());
    const users = await this.userRepository.findManyByIds(idStrings);
    const byHex = new Map(users.map((u) => [u._id.toHexString(), u]));
    const ordered = idStrings.map((id) => byHex.get(id)).filter((u): u is IUser => Boolean(u));
    return { users: ordered.map((u) => this.toFriendUserRow(u)), total };
  }

  async listIncomingRequests(
    myUserId: string,
    page: string,
    limit: string
  ): Promise<{ users: FriendUserRow[]; total: number }> {
    const myOid = new ObjectId(myUserId);
    const { skip, limitNum } = this.parsePageLimit(page, limit);
    const { items, total } = await this.friendRequestRepository.listIncomingForUser(myOid, skip, limitNum);
    const idStrings = items.map((r) => r.fromUserId.toHexString());
    const users = await this.userRepository.findManyByIds(idStrings);
    const byHex = new Map(users.map((u) => [u._id.toHexString(), u]));
    const ordered = idStrings.map((id) => byHex.get(id)).filter((u): u is IUser => Boolean(u));
    return { users: ordered.map((u) => this.toFriendUserRow(u)), total };
  }

  async listOutgoingRequests(
    myUserId: string,
    page: string,
    limit: string
  ): Promise<{ users: FriendUserRow[]; total: number }> {
    const myOid = new ObjectId(myUserId);
    const { skip, limitNum } = this.parsePageLimit(page, limit);
    const { items, total } = await this.friendRequestRepository.listOutgoingForUser(myOid, skip, limitNum);
    const idStrings = items.map((r) => r.toUserId.toHexString());
    const users = await this.userRepository.findManyByIds(idStrings);
    const byHex = new Map(users.map((u) => [u._id.toHexString(), u]));
    const ordered = idStrings.map((id) => byHex.get(id)).filter((u): u is IUser => Boolean(u));
    return { users: ordered.map((u) => this.toFriendUserRow(u)), total };
  }
}

export default FriendsService;
