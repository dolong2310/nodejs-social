import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import type { FriendUserRow, IBlockRepository, IFriendshipRepository, IFriendsService } from '@/modules';
import { BaseService, FriendRequestRepository, IUser, IUserRepository } from '@/modules';
import { BadRequestError, ConflictRequestError, NotFoundError } from '@/providers';
import { MongoServerError, ObjectId } from 'mongodb';

export interface IBlocksService {
  blockUser(blockerUserId: string, blockedUserId: string): Promise<void>;
  unblockUser(blockerUserId: string, blockedUserId: string): Promise<void>;
  listBlockedUsers(
    blockerUserId: string,
    page: string,
    limit: string
  ): Promise<{ users: FriendUserRow[]; total: number }>;
}

export class BlocksService extends BaseService implements IBlocksService {
  constructor(
    private readonly blockRepository: IBlockRepository,
    private readonly friendshipRepository: IFriendshipRepository,
    private readonly friendRequestRepository: FriendRequestRepository,
    private readonly friendsService: IFriendsService,
    private readonly userRepository: IUserRepository
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
      _id: user._id,
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

    const blockerOid = new ObjectId(blockerUserId);
    const blockedOid = new ObjectId(blockedUserId);

    if (await this.blockRepository.isBlockedEitherWay(blockerOid, blockedOid)) {
      throw new ConflictRequestError(VALIDATION_ERROR_MESSAGE.BLOCK_ALREADY_EXISTS);
    }

    await this.friendshipRepository.deleteFriendshipPair(blockerOid, blockedOid);
    await this.friendRequestRepository.deleteAllRequestsInvolvingUsers(blockerOid, blockedOid);

    try {
      await this.blockRepository.createBlock(blockerOid, blockedOid);
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
    const blockerOid = new ObjectId(blockerUserId);
    const blockedOid = new ObjectId(blockedUserId);
    const deleted = await this.blockRepository.deleteBlock(blockerOid, blockedOid);
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
    const blockerOid = new ObjectId(blockerUserId);
    const blockedOids = await this.blockRepository.listBlockedUserIdsForBlocker(blockerOid);
    const sorted = [...blockedOids].sort((a, b) => Buffer.compare(a.id, b.id));
    const total = sorted.length;
    const { skip, limitNum } = this.parsePageLimit(page, limit);
    const pageOids = sorted.slice(skip, skip + limitNum);
    const idStrings = pageOids.map((o) => o.toHexString());
    const users = await this.userRepository.findManyByIds(idStrings);
    const byHex = new Map(users.map((u) => [u._id.toHexString(), u]));
    const ordered = idStrings.map((id) => byHex.get(id)).filter((u): u is IUser => Boolean(u));
    return { users: ordered.map((u) => this.toFriendUserRow(u)), total };
  }
}
