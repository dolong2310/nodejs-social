import { NoPendingFriendRequestException } from '@/modules/friend/application/friend.exception';
import { IFriendService } from '@/modules/friend/application/services/friend.service';
import {
  DeclineIncomingRequestCommand,
  DeclineIncomingRequestInPort
} from '@/modules/friend/application/use-cases/decline-incoming-request/decline-incoming-request.in-port';
import { FriendRequestRepositoryPort } from '@/modules/friend/domain/repositories/friend-request.repository';

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
