import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { Injectable } from '@/decorators';
import type { FriendUserRow } from '@/modules';
import {
  BaseService,
  BlockRepository,
  FriendRequestRepository,
  FriendshipRepository,
  FriendsService,
  IUser,
  UserRepository
} from '@/modules';
import { BadRequestError, ConflictRequestError, NotFoundError } from '@/providers';
import { MongoServerError } from 'mongodb';

export interface IBlocksService {
  blockUser(blockerUserId: string, blockedUserId: string): Promise<void>;
  unblockUser(blockerUserId: string, blockedUserId: string): Promise<void>;
  listBlockedUsers(
    blockerUserId: string,
    page: string,
    limit: string
  ): Promise<{ users: FriendUserRow[]; total: number }>;
}

@Injectable()
export class BlocksService extends BaseService implements IBlocksService {
  constructor(
    private readonly blockRepository: BlockRepository,
    private readonly friendshipRepository: FriendshipRepository,
    private readonly friendRequestRepository: FriendRequestRepository,
    private readonly friendsService: FriendsService,
    private readonly userRepository: UserRepository
  ) {
    super();
  }

  private parsePageLimit(page: string, limit: string): { pageNum: number; limitNum: number; skip: number } {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
  }

  private toFriendUserRow(user: IUser): FriendUserRow {
    return {
      _id: user._id.toHexString(),
      name: user.name,
      username: user.username,
      avatar: user.avatar
    };
  }

  async blockUser(blockerUserId: string, blockedUserId: string): Promise<void> {
    if (blockerUserId === blockedUserId) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CANNOT_BLOCK_YOURSELF);
    }

    const blocked = await this.userRepository.findById(blockedUserId);
    if (!blocked) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    if (await this.blockRepository.isBlockedEitherWay(blockerUserId, blockedUserId)) {
      throw new ConflictRequestError(VALIDATION_ERROR_MESSAGE.BLOCK_ALREADY_EXISTS);
    }

    await this.friendshipRepository.deleteFriendshipPair(blockerUserId, blockedUserId);
    await this.friendRequestRepository.deleteAllRequestsInvolvingUsers(blockerUserId, blockedUserId);

    try {
      await this.blockRepository.createBlock(blockerUserId, blockedUserId);
    } catch (e) {
      if (e instanceof MongoServerError && e.code === 11000) {
        throw new ConflictRequestError(VALIDATION_ERROR_MESSAGE.BLOCK_ALREADY_EXISTS);
      }
      throw e;
    }

    await Promise.all([
      this.friendsService.invalidateFriendCache(blockerUserId),
      this.friendsService.invalidateFriendCache(blockedUserId)
    ]);
  }

  async unblockUser(blockerUserId: string, blockedUserId: string): Promise<void> {
    const deleted = await this.blockRepository.deleteBlock(blockerUserId, blockedUserId);
    if (deleted === 0) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.NO_ACTIVE_BLOCK);
    }
    await Promise.all([
      this.friendsService.invalidateFriendCache(blockerUserId),
      this.friendsService.invalidateFriendCache(blockedUserId)
    ]);
  }

  async listBlockedUsers(
    blockerUserId: string,
    page: string,
    limit: string
  ): Promise<{ users: FriendUserRow[]; total: number }> {
    const blockedHexes = await this.blockRepository.listBlockedUserIdsForBlocker(blockerUserId);
    const sorted = [...blockedHexes].sort((a, b) => Buffer.compare(Buffer.from(a, 'hex'), Buffer.from(b, 'hex')));
    const total = sorted.length;
    const { skip, limitNum } = this.parsePageLimit(page, limit);
    const pageIds = sorted.slice(skip, skip + limitNum);
    const users = await this.userRepository.findManyByIds(pageIds);
    const byHex = new Map(users.map((u) => [u._id.toHexString(), u]));
    const ordered = pageIds.map((id) => byHex.get(id)).filter((u): u is IUser => Boolean(u));
    return { users: ordered.map((u) => this.toFriendUserRow(u)), total };
  }
}
