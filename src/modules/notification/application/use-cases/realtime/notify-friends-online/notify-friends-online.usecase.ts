import {
  type NotifyFriendsOnlineInputPort,
  NotifyFriendsOnlinePort
} from '@/modules/notification/application/use-cases/realtime/notify-friends-online/notify-friends-online.port';
import type { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';

export class NotifyFriendsOnlineUseCase extends NotifyFriendsOnlinePort {
  constructor(private readonly friendshipRepository: FriendshipRepositoryPort) {
    super();
  }

  async execute(input: NotifyFriendsOnlineInputPort): Promise<string[]> {
    return this.friendshipRepository.findFriendIdsByUserId(input.userId).catch(() => []);
  }
}
