import { NoFriendshipWithUserException } from '@/modules/relationship/application/exceptions/friend.exception';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import { UnfriendCommand, UnfriendPort } from '@/modules/relationship/application/use-cases/unfriend/unfriend.port';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';

export class UnfriendUseCase extends UnfriendPort {
  constructor(
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly friendService: FriendServicePort
  ) {
    super();
  }

  async execute({ userId, otherUserId }: UnfriendCommand): Promise<void> {
    const deleted = await this.friendshipRepository.deleteFriendship(userId, otherUserId);
    if (deleted === 0) {
      throw new NoFriendshipWithUserException();
    }
    await this.friendService.invalidateBoth(userId, otherUserId);
  }
}
