import { NoPendingFriendRequestException } from '@/modules/relationship/application/exceptions/friend.exception';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import {
  RevokeOutgoingRequestCommand,
  RevokeOutgoingRequestPort
} from '@/modules/relationship/application/use-cases/revoke-outgoing-request/revoke-outgoing-request.port';
import { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';

export class RevokeOutgoingRequestUseCase extends RevokeOutgoingRequestPort {
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
