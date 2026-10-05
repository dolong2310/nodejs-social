import { NoPendingFriendRequestException } from '@/modules/relationship/application/exceptions/friend.exception';
import type { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import {
  type DeclineIncomingRequestInputPort,
  DeclineIncomingRequestPort
} from '@/modules/relationship/application/use-cases/decline-incoming-request/decline-incoming-request.port';
import type { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';

export class DeclineIncomingRequestUseCase extends DeclineIncomingRequestPort {
  constructor(
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: FriendServicePort
  ) {
    super();
  }

  async execute(input: DeclineIncomingRequestInputPort): Promise<void> {
    const { userId, fromUserId } = input;
    const deleted = await this.friendRequestRepository.deletePendingRequest({ fromUserId, toUserId: userId });
    if (deleted === 0) {
      throw new NoPendingFriendRequestException();
    }
    await this.friendService.invalidateBoth(userId, fromUserId);
  }
}
