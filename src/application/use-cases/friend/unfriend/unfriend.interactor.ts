import { NoFriendshipWithUserException } from '@/application/exceptions/friend.exception';
import { IFriendService } from '@/application/services/friend/friend.service';
import { UnfriendCommand, UnfriendInPort } from '@/application/use-cases/friend/unfriend/unfriend.in-port';
import { FriendshipRepositoryPort } from '@/domain/repositories/friendship/friendship.repository';

export class UnfriendInteractor extends UnfriendInPort {
  constructor(
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly friendService: IFriendService
  ) {
    super();
  }

  async execute({ userId, otherUserId }: UnfriendCommand): Promise<void> {
    const deleted = await this.friendshipRepository.deleteFriendship(userId, otherUserId);
    if (deleted === 0) {
      throw NoFriendshipWithUserException;
    }
    await this.friendService.invalidateBoth(userId, otherUserId);
  }
}
