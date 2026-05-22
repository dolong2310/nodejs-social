import { NotificationServicePort } from '@/modules/notification/application/services/notification.service';
import {
  AlreadyFriendsException,
  CannotSendFriendRequestToYourselfException,
  FriendActionBlockedException,
  FriendRequestDailyLimitExceededException
} from '@/modules/relationship/application/exceptions/friend.exception';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import {
  SendFriendRequestCommand,
  SendFriendRequestPort,
  SendFriendRequestResult
} from '@/modules/relationship/application/use-cases/send-friend-request/send-friend-request.port';
import { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';
import { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';
import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

/**
 * Send a friend request.
 * - Do not allow sending a friend request to yourself.
 * - Check whether the target user exists.
 * - Check whether the target user blocked the sender.
 * - Check whether the target user is already friends with the sender.
 * - Check whether the target user has already sent a friend request to the sender.
 * - Check whether the target user has already sent a friend request to the sender.
 */
export class SendFriendRequestUseCase extends SendFriendRequestPort {
  private readonly OUTGOING_REQUESTS_PER_UTC_DAY = 100;

  constructor(
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: FriendServicePort,
    private readonly blockRepository: BlockRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
    private readonly notificationsService: NotificationServicePort
  ) {
    super();
  }

  async execute({ userId, toUserId }: SendFriendRequestCommand): Promise<SendFriendRequestResult> {
    if (userId === toUserId) {
      throw new CannotSendFriendRequestToYourselfException();
    }

    // Check whether the target user exists.
    const userEntity = await this.userRepository.findUserById(toUserId);
    if (!userEntity) {
      throw new UserNotFoundException();
    }

    const { start, endExclusive } = this._utcDayRange(new Date());
    const [isBlockedEitherWay, existingFriendship, sentToday] = await Promise.all([
      this.blockRepository.isBlockedEitherWay(userId, toUserId),
      this.friendshipRepository.findFriendshipPair(userId, toUserId),
      this.friendRequestRepository.countOutgoingRequestsCreatedOnUtcDay({
        fromUserId: userId,
        dayStart: start,
        dayEndExclusive: endExclusive
      })
    ]);

    // Check whether the target user blocked the sender.
    if (isBlockedEitherWay) {
      throw new FriendActionBlockedException();
    }

    // Check whether the target user is already friends with the sender.
    if (existingFriendship) {
      throw new AlreadyFriendsException();
    }

    // Check whether the sender exceeded the number of friend requests allowed to the target user.
    // A sender can send only 100 friend requests per day to the target user to prevent spam.
    if (sentToday >= this.OUTGOING_REQUESTS_PER_UTC_DAY) {
      throw new FriendRequestDailyLimitExceededException();
    }

    // try/catch handles Mongo duplicate key 11000, usually from the unique index on directed fromUserId+toUserId.
    // -> map to the FRIEND_REQUEST_ALREADY_PENDING business error (409).
    // - if a B->A request is pending, the system still allows A to send A->B, creating two opposite requests.
    // - the DB only prevents duplicates in the same direction (A->B), not the opposite direction.
    // - this is a product choice; some systems auto-accept or block this, but this one does not.
    const friendRequestEntity = await this.friendRequestRepository.createPendingRequest({
      fromUserId: userId,
      toUserId
    });
    // Invalidate sender cache.
    await this.friendService.invalidateFriendCache(userId);
    // Send "friend request" notification to the receiver.
    await this.notificationsService.recordFriendRequest({ recipientUserId: toUserId, fromUserId: userId });

    return new SendFriendRequestResult(friendRequestEntity.toObject());
  }

  private _utcDayRange(now: Date): { start: Date; endExclusive: Date } {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    const start = new Date(Date.UTC(y, m, d));
    const endExclusive = new Date(start.getTime() + 86400000);
    return { start, endExclusive };
  }
}
