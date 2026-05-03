import { BlockRepositoryPort } from '@/modules/block/domain/repositories/block.repository';
import {
  FriendActionBlockedException,
  NoPendingFriendRequestException
} from '@/modules/friend/application/friend.exception';
import { FriendServicePort } from '@/modules/friend/application/services/friend.service';
import {
  AcceptIncomingRequestCommand,
  AcceptIncomingRequestInPort
} from '@/modules/friend/application/use-cases/accept-incoming-request/accept-incoming-request.in-port';
import { FriendRequestRepositoryPort } from '@/modules/friend/domain/repositories/friend-request.repository';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';
import { NotificationServicePort } from '@/modules/notification/application/services/notification.service';

export class AcceptIncomingRequestInteractor extends AcceptIncomingRequestInPort {
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
    // kiểm tra xem người nhận có yêu cầu kết bạn tới người gửi không
    const pending = await this.friendRequestRepository.findPendingRequestByUserPair({ fromUserId, toUserId: userId });
    if (!pending) {
      // kiểm tra xem người gửi và người nhận đã là bạn bè không
      // Mục tiêu: xử lý case "user bấm accept lại / request đã được xử lý trước đó".
      // - Nếu đã là bạn bè, không cần xử lý gì thêm.
      // - Nếu không phải bạn bè và không có pending, throw lỗi NO_PENDING_FRIEND_REQUEST.
      const alreadyFriends = await this.friendshipRepository.findFriendshipPair(fromUserId, userId);
      if (alreadyFriends) return;
      throw new NoPendingFriendRequestException();
    }

    // kiểm tra xem người nhận có block người gửi không
    if (await this.blockRepository.isBlockedEitherWay(userId, fromUserId)) {
      throw new FriendActionBlockedException();
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
