import { BlockRepositoryPort } from '@/modules/block/domain/repositories/block.repository';
import {
  AlreadyFriendsException,
  CannotSendFriendRequestToYourselfException,
  FriendActionBlockedException,
  FriendRequestDailyLimitExceededException
} from '@/modules/friend/application/friend.exception';
import { IFriendService } from '@/modules/friend/application/services/friend.service';
import {
  SendFriendRequestCommand,
  SendFriendRequestInPort,
  SendFriendRequestResult
} from '@/modules/friend/application/use-cases/send-friend-request/send-friend-request.in-port';
import { FriendRequestRepositoryPort } from '@/modules/friend/domain/repositories/friend-request.repository';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';
import { INotificationsService } from '@/modules/notification/application/services/notification.service';
import { UserNotFoundException } from '@/modules/user/application/user.exception';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

/**
 * Gửi yêu cầu kết bạn
 * - Không cho gửi yêu cầu kết bạn tới chính mình.
 * - Kiểm tra xem người được gửi yêu cầu có tồn tại không.
 * - Kiểm tra xem người được gửi yêu cầu có block người gửi không.
 * - Kiểm tra xem người được gửi yêu cầu có là bạn bè với người gửi không.
 * - Kiểm tra xem người được gửi yêu cầu có đã gửi yêu cầu kết bạn tới người gửi không.
 * - Kiểm tra xem người được gửi yêu cầu có đã gửi yêu cầu kết bạn tới người gửi không.
 */
export class SendFriendRequestInteractor extends SendFriendRequestInPort {
  private readonly OUTGOING_REQUESTS_PER_UTC_DAY = 100;

  constructor(
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: IFriendService,
    private readonly blockRepository: BlockRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
    private readonly notificationsService: INotificationsService
  ) {
    super();
  }

  async execute({ userId, toUserId }: SendFriendRequestCommand): Promise<SendFriendRequestResult> {
    if (userId === toUserId) {
      throw CannotSendFriendRequestToYourselfException;
    }

    // kiểm tra xem người được gửi yêu cầu có tồn tại không
    const userEntity = await this.userRepository.findUserById(toUserId);
    if (!userEntity) {
      throw UserNotFoundException;
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

    // kiểm tra xem người được gửi yêu cầu có block người gửi không
    if (isBlockedEitherWay) {
      throw FriendActionBlockedException;
    }

    // kiểm tra xem người được gửi yêu cầu có là bạn bè với người gửi không
    if (existingFriendship) {
      throw AlreadyFriendsException;
    }

    // kiểm tra xem người gửi có vượt quá số lượng yêu cầu kết bạn tới người được gửi yêu cầu không
    // Vì 1 ngày chỉ được gửi 100 yêu cầu kết bạn tới người được gửi yêu cầu không => tránh spam
    if (sentToday >= this.OUTGOING_REQUESTS_PER_UTC_DAY) {
      throw FriendRequestDailyLimitExceededException;
    }

    // try/catch để bắt lỗi Mongo duplicate key 11000 (thường do unique index theo cặp directed fromUserId+toUserId)
    // -> map sang lỗi nghiệp vụ FRIEND_REQUEST_ALREADY_PENDING (409).
    // - nếu đang có request B->A pending, hệ thống vẫn cho phép A gửi A->B (tạo 2 request ngược chiều cùng lúc).
    // - DB chỉ chống trùng cùng chiều (A->B) chứ không chống "ngược chiều".
    // - đây là lựa chọn nghiệp vụ (có hệ thống sẽ tự chuyển thành "accept" hoặc chặn, nhưng ở đây thì không).
    const friendRequestEntity = await this.friendRequestRepository.createPendingRequest({
      fromUserId: userId,
      toUserId
    });
    // invalidate cache của người gửi
    await this.friendService.invalidateFriendCache(userId);
    // notification "friend request" cho người nhận
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
