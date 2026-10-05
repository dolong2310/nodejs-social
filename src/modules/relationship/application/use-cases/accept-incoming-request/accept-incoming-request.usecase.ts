import type { UnitOfWorkPort } from '@/modules/core/application/ports/unit-of-work.port';
import type { NotificationServicePort } from '@/modules/notification/application/services/notification.service';
import {
  FriendActionBlockedException,
  NoPendingFriendRequestException
} from '@/modules/relationship/application/exceptions/friend.exception';
import type { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import {
  type AcceptIncomingRequestInputPort,
  AcceptIncomingRequestPort
} from '@/modules/relationship/application/use-cases/accept-incoming-request/accept-incoming-request.port';
import type { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';
import type { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';
import type { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';

export class AcceptIncomingRequestUseCase extends AcceptIncomingRequestPort {
  constructor(
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: FriendServicePort,
    private readonly blockRepository: BlockRepositoryPort,
    private readonly notificationsService: NotificationServicePort,
    private readonly unitOfWork: UnitOfWorkPort
  ) {
    super();
  }

  async execute(input: AcceptIncomingRequestInputPort): Promise<void> {
    const { userId, fromUserId } = input;
    // Check whether the receiver has a friend request from the sender.
    const pending = await this.friendRequestRepository.findPendingRequestByUserPair({ fromUserId, toUserId: userId });
    if (!pending) {
      // Check whether sender and receiver are already friends.
      // Goal: handle "user clicked accept again / request was already processed".
      // - If already friends, no extra work is needed.
      // - If not friends and no pending request exists, throw NO_PENDING_FRIEND_REQUEST.
      const alreadyFriends = await this.friendshipRepository.findFriendshipPair(fromUserId, userId);
      if (alreadyFriends) return;
      throw new NoPendingFriendRequestException();
    }

    // Check whether the receiver blocked the sender.
    if (await this.blockRepository.isBlockedEitherWay(userId, fromUserId)) {
      throw new FriendActionBlockedException();
    }

    // Create the friendship and consume the request atomically.
    const created = await this.unitOfWork.run(async () => {
      // null means the friendship already exists; the request is still deleted.
      const friendship = await this.friendshipRepository.createFriendship(fromUserId, userId);
      await this.friendRequestRepository.deletePendingRequest({ fromUserId, toUserId: userId });
      return friendship !== null;
    });

    await Promise.all([
      this.friendService.invalidateBoth(userId, fromUserId),
      // Send "friend accepted" notification to the sender only when this request created the friendship.
      created
        ? this.notificationsService.recordFriendAccepted({
            originalRequesterUserId: fromUserId,
            accepterUserId: userId
          })
        : Promise.resolve()
    ]);
  }
}
