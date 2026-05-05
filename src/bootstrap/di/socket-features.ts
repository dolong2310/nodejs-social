import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';
import { GetConversationPresenceUseCase } from '@/modules/notification/application/use-cases/realtime/get-conversation-presence/get-conversation-presence.usecase';
import { JoinConversationUseCase } from '@/modules/notification/application/use-cases/realtime/join-conversation/join-conversation.usecase';
import { LeaveConversationUseCase as LeaveConversationSocketUseCase } from '@/modules/notification/application/use-cases/realtime/leave-conversation/leave-conversation.usecase';
import { NotifyFriendsOfflineUseCase } from '@/modules/notification/application/use-cases/realtime/notify-friends-offline/notify-friends-offline.usecase';
import { NotifyFriendsOnlineUseCase } from '@/modules/notification/application/use-cases/realtime/notify-friends-online/notify-friends-online.usecase';
import { TypingUseCase } from '@/modules/notification/application/use-cases/realtime/typing/typing.usecase';
import { ChatFeature } from '@/presentation/socket/features/chat.feature';
import { PresenceFeature } from '@/presentation/socket/features/presence.feature';

type SocketFeatures = {
  presenceFeature: PresenceFeature;
  chatFeature: ChatFeature;
};

type SocketFeaturesContext = {
  friendshipRepository: FriendshipRepositoryPort;
  conversationMemberRepository: ConversationMemberRepositoryPort;
};

export function buildSocketFeatures(ctx: SocketFeaturesContext): SocketFeatures {
  const { friendshipRepository, conversationMemberRepository } = ctx;

  const notifyFriendsOnlineUC = new NotifyFriendsOnlineUseCase(friendshipRepository);
  const notifyFriendsOfflineUC = new NotifyFriendsOfflineUseCase(friendshipRepository);
  const joinConversationUC = new JoinConversationUseCase(conversationMemberRepository);
  const leaveConversationSocketUC = new LeaveConversationSocketUseCase(conversationMemberRepository);
  const typingUC = new TypingUseCase(conversationMemberRepository);
  const presenceUC = new GetConversationPresenceUseCase(conversationMemberRepository);

  const features = {
    presenceFeature: new PresenceFeature(notifyFriendsOnlineUC, notifyFriendsOfflineUC),
    chatFeature: new ChatFeature(joinConversationUC, leaveConversationSocketUC, typingUC, presenceUC)
  };

  return features;
}
