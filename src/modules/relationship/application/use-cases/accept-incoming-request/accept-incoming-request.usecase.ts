import { NotificationServicePort } from '@/modules/notification/application/services/notification.service';
import {
  FriendActionBlockedException,
  NoPendingFriendRequestException
} from '@/modules/relationship/application/exceptions/friend.exception';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import {
  AcceptIncomingRequestCommand,
  AcceptIncomingRequestPort
} from '@/modules/relationship/application/use-cases/accept-incoming-request/accept-incoming-request.port';
import { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';
import { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';

export class AcceptIncomingRequestUseCase extends AcceptIncomingRequestPort {
  constructor(
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: FriendServicePort,
    private readonly blockRepository: BlockRepositoryPort,
    private readonly notificationsService: NotificationServicePort
  ) {
    super();
  }

  async execute({ userId, fromUserId }: AcceptIncomingRequestCommand): Promise<void> {
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

    const entity = await this.friendshipRepository.createFriendship(fromUserId, userId);
    if (!entity) {
      // If friendship already exists, delete the request and invalidate cache.
      await Promise.all([
        this.friendRequestRepository.deletePendingRequest({ fromUserId, toUserId: userId }),
        this.friendService.invalidateBoth(userId, fromUserId)
      ]);
      return;
    }

    await Promise.all([
      // Delete the request and invalidate cache.
      this.friendRequestRepository.deletePendingRequest({ fromUserId, toUserId: userId }),
      this.friendService.invalidateBoth(userId, fromUserId),
      // Send "friend accepted" notification to the sender.
      this.notificationsService.recordFriendAccepted({ originalRequesterUserId: fromUserId, accepterUserId: userId })
    ]);
  }
}
