import {
  NotifyFriendsOfflineCommand,
  NotifyFriendsOfflineInPort
} from '@/application/use-cases/realtime/notify-friends-offline/notify-friends-offline.in-port';
import { FriendshipRepositoryPort } from '@/domain/repositories/friendship/friendship.repository';

export class NotifyFriendsOfflineInteractor extends NotifyFriendsOfflineInPort {
  constructor(private readonly friendshipRepository: FriendshipRepositoryPort) {
    super();
  }

  async execute({ userId }: NotifyFriendsOfflineCommand): Promise<string[]> {
    return this.friendshipRepository.findFriendIdsByUserId(userId).catch(() => []);
  }
}
