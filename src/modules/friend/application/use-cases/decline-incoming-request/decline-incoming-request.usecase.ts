import { NoPendingFriendRequestException } from '@/modules/friend/application/friend.exception';
import { FriendServicePort } from '@/modules/friend/application/services/friend.service';
import {
  DeclineIncomingRequestCommand,
  DeclineIncomingRequestPort
} from '@/modules/friend/application/use-cases/decline-incoming-request/decline-incoming-request.port';
import { FriendRequestRepositoryPort } from '@/modules/friend/domain/repositories/friend-request.repository';

export class DeclineIncomingRequestUseCase extends DeclineIncomingRequestPort {
  constructor(
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: FriendServicePort
  ) {
    super();
  }

  async execute({ userId, fromUserId }: DeclineIncomingRequestCommand): Promise<void> {
    const deleted = await this.friendRequestRepository.deletePendingRequest({ fromUserId, toUserId: userId });
    if (deleted === 0) {
      throw new NoPendingFriendRequestException();
    }
    await this.friendService.invalidateBoth(userId, fromUserId);
  }
}
