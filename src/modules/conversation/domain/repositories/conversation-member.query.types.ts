import type { DateIdCursor } from '@/modules/common/domain/value-objects/cursor.value-object';
import type { ConversationMemberProps } from '@/modules/conversation/domain/entities/conversation-member.types';

export interface ListConversationsForUserInput extends Pick<ConversationMemberProps, 'userId'> {
  limit: number;
  cursor?: DateIdCursor;
}

export interface ListConversationsForUserOutput {
  conversationId: string;
  updatedAt: Date;
}
