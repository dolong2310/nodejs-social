import { BlockAlreadyExistsException, CannotBlockYourselfException } from '@/application/exceptions/block.exception';
import { UserNotFoundException } from '@/application/exceptions/user.exception';
import { IBlockService } from '@/application/services/block/block.service';
import { IFriendService } from '@/application/services/friend/friend.service';
import { BlockUserCommand, BlockUserInPort } from '@/application/use-cases/block/block-user/block-user.in-port';
import { BlockRepositoryPort } from '@/domain/repositories/block/block.repository';
import { FriendRequestRepositoryPort } from '@/domain/repositories/friend-request/friend-request.repository';
import { FriendshipRepositoryPort } from '@/domain/repositories/friendship/friendship.repository';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';

export class BlockUserInteractor extends BlockUserInPort {
  constructor(
    private readonly blockRepository: BlockRepositoryPort,
    private readonly blockService: IBlockService,
    private readonly userRepository: UserRepositoryPort,
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: IFriendService
  ) {
    super();
  }

  async execute({ blockerUserId, blockedUserId }: BlockUserCommand): Promise<void> {
    if (blockerUserId === blockedUserId) {
      throw CannotBlockYourselfException;
    }

    const userEntity = await this.userRepository.findSafeUserById(blockedUserId);
    if (!userEntity) {
      throw UserNotFoundException;
    }

    if (await this.blockService.isBlockedEitherWay(blockerUserId, blockedUserId)) {
      throw BlockAlreadyExistsException;
    }

    await this.friendshipRepository.deleteFriendship(blockerUserId, blockedUserId);
    await this.friendRequestRepository.deleteAllRequestsBetweenUsers({
      fromUserId: blockerUserId,
      toUserId: blockedUserId
    });

    await this.blockRepository.createBlock(blockerUserId, blockedUserId);

    await Promise.all([
      this.friendService.invalidateFriendCache(blockerUserId),
      this.friendService.invalidateFriendCache(blockedUserId)
    ]);
  }
}
