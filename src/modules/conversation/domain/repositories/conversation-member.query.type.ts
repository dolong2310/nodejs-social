import { DateIdCursor } from '@/modules/common/domain/value-objects/cursor.value-object';
import { ConversationMemberProps } from '@/modules/conversation/domain/entities/conversation-member.type';

export interface ListConversationsForUserInput extends Pick<ConversationMemberProps, 'userId'> {
  limit: number;
  cursor?: DateIdCursor;
}

export interface ListConversationsForUserOutput {
  conversationId: string;
  updatedAt: Date;
}
