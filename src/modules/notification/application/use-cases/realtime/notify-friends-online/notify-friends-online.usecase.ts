import {
  NotifyFriendsOnlineCommand,
  NotifyFriendsOnlinePort
} from '@/modules/notification/application/use-cases/realtime/notify-friends-online/notify-friends-online.port';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';

export class NotifyFriendsOnlineUseCase extends NotifyFriendsOnlinePort {
  constructor(private readonly friendshipRepository: FriendshipRepositoryPort) {
    super();
  }

  async execute({ userId }: NotifyFriendsOnlineCommand): Promise<string[]> {
    return this.friendshipRepository.findFriendIdsByUserId(userId).catch(() => []);
  }
}
