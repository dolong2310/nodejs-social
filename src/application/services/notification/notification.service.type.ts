import { ChatMessageEntity } from '@/domain/entities/chat-message/chat-message.entity';
import { ConversationEntity } from '@/domain/entities/conversation/conversation.entity';

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
