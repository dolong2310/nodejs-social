import { NoPendingFriendRequestException } from '@/application/exceptions/friend.exception';
import { IFriendService } from '@/application/services/friend/friend.service';
import {
  DeclineIncomingRequestCommand,
  DeclineIncomingRequestInPort
} from '@/application/use-cases/friend/decline-incoming-request/decline-incoming-request.in-port';
import { FriendRequestRepositoryPort } from '@/domain/repositories/friend-request/friend-request.repository';

export class DeclineIncomingRequestInteractor extends DeclineIncomingRequestInPort {
  constructor(
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: IFriendService
  ) {
    super();
  }

  async execute({ userId, fromUserId }: DeclineIncomingRequestCommand): Promise<void> {
    const deleted = await this.friendRequestRepository.deletePendingRequest({ fromUserId, toUserId: userId });
    if (deleted === 0) {
      throw NoPendingFriendRequestException;
    }
    await this.friendService.invalidateBoth(userId, fromUserId);
  }
}
