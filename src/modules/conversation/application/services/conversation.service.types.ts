import type { ConversationMemberEntity } from '@/modules/conversation/domain/entities/conversation-member.entity';
import type { ConversationMemberFullProps } from '@/modules/conversation/domain/entities/conversation-member.types';
import type { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import type { ConversationFullProps } from '@/modules/conversation/domain/entities/conversation.types';

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
