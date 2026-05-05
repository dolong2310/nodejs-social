import {
  NotifyFriendsOfflineCommand,
  NotifyFriendsOfflinePort
} from '@/modules/notification/application/use-cases/realtime/notify-friends-offline/notify-friends-offline.port';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';

export class NotifyFriendsOfflineUseCase extends NotifyFriendsOfflinePort {
  constructor(private readonly friendshipRepository: FriendshipRepositoryPort) {
    super();
  }

  async execute({ userId }: NotifyFriendsOfflineCommand): Promise<string[]> {
    return this.friendshipRepository.findFriendIdsByUserId(userId).catch(() => []);
  }
}
