import { NoPendingFriendRequestException } from '@/modules/friend/application/friend.exception';
import { FriendServicePort } from '@/modules/friend/application/services/friend.service';
import {
  RevokeOutgoingRequestCommand,
  RevokeOutgoingRequestInPort
} from '@/modules/friend/application/use-cases/revoke-outgoing-request/revoke-outgoing-request.in-port';
import { FriendRequestRepositoryPort } from '@/modules/friend/domain/repositories/friend-request.repository';

export class RevokeOutgoingRequestInteractor extends RevokeOutgoingRequestInPort {
  constructor(
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly friendService: FriendServicePort
  ) {
    super();
  }

  async execute({ userId, toUserId }: RevokeOutgoingRequestCommand): Promise<void> {
    const deleted = await this.friendRequestRepository.deletePendingRequest({ fromUserId: userId, toUserId });
    if (deleted === 0) {
      throw new NoPendingFriendRequestException();
    }
    await this.friendService.invalidateBoth(userId, toUserId);
  }
}
