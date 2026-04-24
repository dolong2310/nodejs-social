import { GetConversationPresenceInteractor } from '@/application/use-cases/realtime/get-conversation-presence/get-conversation-presence.interactor';
import { JoinConversationInteractor } from '@/application/use-cases/realtime/join-conversation/join-conversation.interactor';
import { LeaveConversationInteractor as LeaveConversationSocketInteractor } from '@/application/use-cases/realtime/leave-conversation/leave-conversation.interactor';
import { NotifyFriendsOfflineInteractor } from '@/application/use-cases/realtime/notify-friends-offline/notify-friends-offline.interactor';
import { NotifyFriendsOnlineInteractor } from '@/application/use-cases/realtime/notify-friends-online/notify-friends-online.interactor';
import { TypingInteractor } from '@/application/use-cases/realtime/typing/typing.interactor';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';
import { FriendshipRepositoryPort } from '@/domain/repositories/friendship/friendship.repository';
import { ChatFeature } from '@/presentation/socket/chat.feature';
import { PresenceFeature } from '@/presentation/socket/presence.feature';

export type SocketFeatures = {
  presenceFeature: PresenceFeature;
  chatFeature: ChatFeature;
};

export type SocketFeaturesContext = {
  friendshipRepository: FriendshipRepositoryPort;
  conversationMemberRepository: ConversationMemberRepositoryPort;
};

export function buildSocketFeatures(ctx: SocketFeaturesContext): SocketFeatures {
  const { friendshipRepository, conversationMemberRepository } = ctx;

  const notifyFriendsOnlineUC = new NotifyFriendsOnlineInteractor(friendshipRepository);
  const notifyFriendsOfflineUC = new NotifyFriendsOfflineInteractor(friendshipRepository);
  const joinConversationUC = new JoinConversationInteractor(conversationMemberRepository);
  const leaveConversationSocketUC = new LeaveConversationSocketInteractor(conversationMemberRepository);
  const typingUC = new TypingInteractor(conversationMemberRepository);
  const presenceUC = new GetConversationPresenceInteractor(conversationMemberRepository);

  const features = {
    presenceFeature: new PresenceFeature(notifyFriendsOnlineUC, notifyFriendsOfflineUC),
    chatFeature: new ChatFeature(joinConversationUC, leaveConversationSocketUC, typingUC, presenceUC)
  };

  return features;
}
