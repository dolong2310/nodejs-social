import { NoPendingFriendRequestException } from '@/application/exceptions/friend.exception';
import { IFriendService } from '@/application/services/friend/friend.service';
import {
  RevokeOutgoingRequestCommand,
  RevokeOutgoingRequestInPort
} from '@/application/use-cases/friend/revoke-outgoing-request/revoke-outgoing-request.in-port';
import { FriendRequestRepositoryPort } from '@/domain/repositories/friend-request/friend-request.repository';

export class RevokeOutgoingRequestInteractor extends RevokeOutgoingRequestInPort {
  constructor(
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: IFriendService
  ) {
    super();
  }

  async execute({ userId, toUserId }: RevokeOutgoingRequestCommand): Promise<void> {
    const deleted = await this.friendRequestRepository.deletePendingRequest({ fromUserId: userId, toUserId });
    if (deleted === 0) {
      throw NoPendingFriendRequestException;
    }
    await this.friendService.invalidateBoth(userId, toUserId);
  }
}
