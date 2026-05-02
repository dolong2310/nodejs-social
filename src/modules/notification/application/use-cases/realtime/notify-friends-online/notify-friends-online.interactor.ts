import {
  NotifyFriendsOnlineCommand,
  NotifyFriendsOnlineInPort
} from '@/modules/notification/application/use-cases/realtime/notify-friends-online/notify-friends-online.in-port';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';

export class NotifyFriendsOnlineInteractor extends NotifyFriendsOnlineInPort {
  constructor(private readonly friendshipRepository: FriendshipRepositoryPort) {
    super();
  }

  async execute({ userId }: NotifyFriendsOnlineCommand): Promise<string[]> {
    return this.friendshipRepository.findFriendIdsByUserId(userId).catch(() => []);
  }
}
