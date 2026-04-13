import { IUser } from '@/domain/entities/user.entity';
import { IBlockRepository } from '@/domain/repositories/block/block.repository';
import { IFriendRequestRepository } from '@/domain/repositories/friend-request/friend-request.repository';
import { IFriendshipRepository } from '@/domain/repositories/friendship/friendship.repository';
import { IUserRepository } from '@/domain/repositories/user/user.repository';

import {
  BlockUserPayloadDTO,
  ListBlockedUsersPayloadDTO,
  UnBlockUserPayloadDTO
} from '@/application/dtos/block/block.payload.dto';
import { ListBlockedUsersResultDTO } from '@/application/dtos/block/block.result.dto';
import type { FriendUserRow } from '@/application/dtos/friend/friend.result.dto';
import {
  BlockAlreadyExistsException,
  BlockUserNotFoundException,
  CannotBlockYourselfException,
  NoActiveBlockException
} from '@/application/errors/block.error';
import { IBlocksService } from '@/application/ports/block.port';
import type { IFriendsService } from '@/application/ports/friend.port';
import { BaseService } from '@/application/use-cases/base.service';

export class BlocksService extends BaseService implements IBlocksService {
  constructor(
    private readonly blockRepository: IBlockRepository,
    private readonly userRepository: IUserRepository,
    private readonly friendshipRepository: IFriendshipRepository,
    private readonly friendRequestRepository: IFriendRequestRepository,
    private readonly friendsService: IFriendsService
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
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar
    };
  }

  async blockUser({ blockerUserId, blockedUserId }: BlockUserPayloadDTO): Promise<void> {
    if (blockerUserId === blockedUserId) {
      throw CannotBlockYourselfException;
    }

    const blocked = await this.userRepository.findUserById({ id: blockedUserId });
    if (!blocked) {
      throw BlockUserNotFoundException;
    }

    if (await this.blockRepository.isBlockedEitherWay({ aUserId: blockerUserId, bUserId: blockedUserId })) {
      throw BlockAlreadyExistsException;
    }

    await this.friendshipRepository.deleteFriendship({ aUserId: blockerUserId, bUserId: blockedUserId });
    await this.friendRequestRepository.deleteAllRequestsBetweenUsers({
      fromUserId: blockerUserId,
      toUserId: blockedUserId
    });

    await this.blockRepository.createBlock({ blockerId: blockerUserId, blockedId: blockedUserId });

    await Promise.all([
      this.friendsService.invalidateFriendCache({ userId: blockerUserId }),
      this.friendsService.invalidateFriendCache({ userId: blockedUserId })
    ]);
  }

  async unblockUser({ blockerUserId, blockedUserId }: UnBlockUserPayloadDTO): Promise<void> {
    const deleted = await this.blockRepository.deleteBlock({ blockerId: blockerUserId, blockedId: blockedUserId });
    if (deleted === 0) {
      throw NoActiveBlockException;
    }
    await Promise.all([
      this.friendsService.invalidateFriendCache({ userId: blockerUserId }),
      this.friendsService.invalidateFriendCache({ userId: blockedUserId })
    ]);
  }

  async listBlockedUsers({
    blockerUserId,
    page,
    limit
  }: ListBlockedUsersPayloadDTO): Promise<ListBlockedUsersResultDTO> {
    const { ids: blockedIds } = await this.blockRepository.listBlockedUserIdsForBlocker({ blockerId: blockerUserId });
    const sorted = [...blockedIds].sort((a, b) => Buffer.compare(Buffer.from(a, 'hex'), Buffer.from(b, 'hex')));
    const total = sorted.length;
    const { skip, limitNum } = this.parsePageLimit(page, limit);
    const pageIds = sorted.slice(skip, skip + limitNum);
    const users = await this.userRepository.findManyUsersByIds({ ids: pageIds });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const ordered = pageIds.map((id) => userMap.get(id)).filter((u): u is IUser => Boolean(u));
    const items = ordered.map((u) => this.toFriendUserRow(u));
    return new ListBlockedUsersResultDTO({ users: items, total });
  }
}
