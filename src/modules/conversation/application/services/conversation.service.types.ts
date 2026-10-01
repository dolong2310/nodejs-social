import { ConversationMemberEntity } from '@/modules/conversation/domain/entities/conversation-member.entity';
import { ConversationMemberFullProps } from '@/modules/conversation/domain/entities/conversation-member.types';
import { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import { ConversationFullProps } from '@/modules/conversation/domain/entities/conversation.types';

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
