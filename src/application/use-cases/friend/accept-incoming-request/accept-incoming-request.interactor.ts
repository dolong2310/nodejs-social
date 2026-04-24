import {
  FriendActionBlockedException,
  NoPendingFriendRequestException
} from '@/application/exceptions/friend.exception';
import { IFriendService } from '@/application/services/friend/friend.service';
import { INotificationsService } from '@/application/services/notification/notification.service';
import {
  AcceptIncomingRequestCommand,
  AcceptIncomingRequestInPort
} from '@/application/use-cases/friend/accept-incoming-request/accept-incoming-request.in-port';
import { BlockRepositoryPort } from '@/domain/repositories/block/block.repository';
import { FriendRequestRepositoryPort } from '@/domain/repositories/friend-request/friend-request.repository';
import { FriendshipRepositoryPort } from '@/domain/repositories/friendship/friendship.repository';

export class AcceptIncomingRequestInteractor extends AcceptIncomingRequestInPort {
  constructor(
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: IFriendService,
    private readonly blockRepository: BlockRepositoryPort,
    private readonly notificationsService: INotificationsService
  ) {
    super();
  }

  async execute({ userId, fromUserId }: AcceptIncomingRequestCommand): Promise<void> {
    // kiểm tra xem người nhận có yêu cầu kết bạn tới người gửi không
    const pending = await this.friendRequestRepository.findPendingRequestByUserPair({ fromUserId, toUserId: userId });
    if (!pending) {
      // kiểm tra xem người gửi và người nhận đã là bạn bè không
      // Mục tiêu: xử lý case "user bấm accept lại / request đã được xử lý trước đó".
      // - Nếu đã là bạn bè, không cần xử lý gì thêm.
      // - Nếu không phải bạn bè và không có pending, throw lỗi NO_PENDING_FRIEND_REQUEST.
      const alreadyFriends = await this.friendshipRepository.findFriendshipPair(fromUserId, userId);
      if (alreadyFriends) return;
      throw NoPendingFriendRequestException;
    }

    // kiểm tra xem người nhận có block người gửi không
    if (await this.blockRepository.isBlockedEitherWay(userId, fromUserId)) {
      throw FriendActionBlockedException;
    }

    const entity = await this.friendshipRepository.createFriendship(fromUserId, userId);
    if (!entity) {
      // nếu đã tồn tại friendship, xóa request và invalidate cache
      await Promise.all([
        this.friendRequestRepository.deletePendingRequest({ fromUserId, toUserId: userId }),
        this.friendService.invalidateBoth(userId, fromUserId)
      ]);
      return;
    }

    await Promise.all([
      // xóa request và invalidate cache
      this.friendRequestRepository.deletePendingRequest({ fromUserId, toUserId: userId }),
      this.friendService.invalidateBoth(userId, fromUserId),
      // notification "friend accepted" cho người gửi
      this.notificationsService.recordFriendAccepted({ originalRequesterUserId: fromUserId, accepterUserId: userId })
    ]);
  }
}
