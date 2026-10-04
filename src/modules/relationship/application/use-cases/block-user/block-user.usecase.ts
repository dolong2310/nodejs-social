import type { UnitOfWorkPort } from '@/modules/core/application/ports/unit-of-work.port';
import {
  BlockAlreadyExistsException,
  CannotBlockYourselfException
} from '@/modules/relationship/application/exceptions/block.exception';
import type { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import type { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import {
  type BlockUserInputPort,
  BlockUserPort
} from '@/modules/relationship/application/use-cases/block-user/block-user.port';
import type { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';
import type { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';
import type { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';
import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import type { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class BlockUserUseCase extends BlockUserPort {
  constructor(
    private readonly blockRepository: BlockRepositoryPort,
    private readonly blockService: BlockServicePort,
    private readonly userRepository: UserRepositoryPort,
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: FriendServicePort,
    private readonly unitOfWork: UnitOfWorkPort
  ) {
    super();
  }

  async execute(input: BlockUserInputPort): Promise<void> {
    const { blockerUserId, blockedUserId } = input;
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

    // Remove the relationship and create the block atomically: if the block fails (e.g. a concurrent duplicate),
    // the friendship and requests are kept.
    await this.unitOfWork.run(async () => {
      await this.friendshipRepository.deleteFriendship(blockerUserId, blockedUserId);
      await this.friendRequestRepository.deleteAllRequestsBetweenUsers({
        fromUserId: blockerUserId,
        toUserId: blockedUserId
      });
      await this.blockRepository.createBlock(blockerUserId, blockedUserId);
    });

    await Promise.all([
      this.friendService.invalidateFriendCache(blockerUserId),
      this.friendService.invalidateFriendCache(blockedUserId)
    ]);
  }
}
