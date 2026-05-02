import { ChatMessageEntity } from '@/modules/conversation/domain/entities/chat-message.entity';
import { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';

export interface RecordFriendRequestPayload {
  recipientUserId: string;
  fromUserId: string;
}

export interface RecordFriendAcceptedPayload {
  originalRequesterUserId: string;
  accepterUserId: string;
}

export interface RecordNewMessagePayload {
  message: ChatMessageEntity;
  senderUserId: string;
  recipientUserIds: string[];
}

export interface RecordAddedToGroupPayload {
  inviteeUserId: string;
  inviterUserId: string;
  conv: ConversationEntity;
}
