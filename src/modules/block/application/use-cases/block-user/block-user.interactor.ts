import { BlockAlreadyExistsException, CannotBlockYourselfException } from '@/modules/block/application/block.exception';
import { UserNotFoundException } from '@/modules/user/application/user.exception';
import { BlockServicePort } from '@/modules/block/application/services/block.service';
import { FriendServicePort } from '@/modules/friend/application/services/friend.service';
import { BlockUserCommand, BlockUserInPort } from '@/modules/block/application/use-cases/block-user/block-user.in-port';
import { BlockRepositoryPort } from '@/modules/block/domain/repositories/block.repository';
import { FriendRequestRepositoryPort } from '@/modules/friend/domain/repositories/friend-request.repository';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class BlockUserInteractor extends BlockUserInPort {
  constructor(
    private readonly blockRepository: BlockRepositoryPort,
    private readonly blockService: BlockServicePort,
    private readonly userRepository: UserRepositoryPort,
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: FriendServicePort
  ) {
    super();
  }

  async execute({ blockerUserId, blockedUserId }: BlockUserCommand): Promise<void> {
    if (blockerUserId === blockedUserId) {
      throw new CannotBlockYourselfException();
    }

    const userEntity = await this.userRepository.findUserById(blockedUserId);
    if (!userEntity) {
      throw new UserNotFoundException();
    }

    if (await this.blockService.isBlockedEitherWay(blockerUserId, blockedUserId)) {
      throw new BlockAlreadyExistsException();
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
