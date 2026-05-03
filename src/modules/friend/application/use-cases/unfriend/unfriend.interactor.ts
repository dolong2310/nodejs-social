import { NoFriendshipWithUserException } from '@/modules/friend/application/friend.exception';
import { FriendServicePort } from '@/modules/friend/application/services/friend.service';
import { UnfriendCommand, UnfriendInPort } from '@/modules/friend/application/use-cases/unfriend/unfriend.in-port';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';

export class UnfriendInteractor extends UnfriendInPort {
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
