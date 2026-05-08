import {
  BlockAlreadyExistsException,
  CannotBlockYourselfException
} from '@/modules/relationship/application/exceptions/block.exception';
import { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import {
  BlockUserCommand,
  BlockUserPort
} from '@/modules/relationship/application/use-cases/block-user/block-user.port';
import { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';
import { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';
import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class BlockUserUseCase extends BlockUserPort {
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
