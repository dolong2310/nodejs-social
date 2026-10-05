import {
  type NotifyFriendsOfflineInputPort,
  NotifyFriendsOfflinePort
} from '@/modules/notification/application/use-cases/realtime/notify-friends-offline/notify-friends-offline.port';
import type { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';

export class NotifyFriendsOfflineUseCase extends NotifyFriendsOfflinePort {
  constructor(private readonly friendshipRepository: FriendshipRepositoryPort) {
    super();
  }

  async execute(input: NotifyFriendsOfflineInputPort): Promise<string[]> {
    return this.friendshipRepository.findFriendIdsByUserId(input.userId).catch(() => []);
  }
}
