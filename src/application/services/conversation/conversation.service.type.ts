import { ConversationMemberEntity } from '@/domain/entities/conversation-member/conversation-member.entity';
import { ConversationMemberFullProps } from '@/domain/entities/conversation-member/conversation-member.type';
import { ConversationEntity } from '@/domain/entities/conversation/conversation.entity';
import { ConversationFullProps } from '@/domain/entities/conversation/conversation.type';

export interface GetDirectPeerIdPayload {
  conv: ConversationEntity;
  userId: string;
}

export interface AssertMemberPayload {
  conversationId: string;
  userId: string;
}

export interface MapConversationDetailPayload {
  userId: string;
  conv: ConversationEntity;
  members: ConversationMemberEntity[];
}

// Output

export interface ConversationDetailResult extends ConversationFullProps {
  peerUserId?: string;
  members: ConversationMemberFullProps[];
}
