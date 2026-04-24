import { ConversationMemberProps } from '@/domain/entities/conversation-member/conversation-member.type';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';

export interface IListConversationsForUserInput extends Pick<ConversationMemberProps, 'userId'> {
  limit: number;
  cursor?: DateIdCursor;
}

export interface IListConversationsForUserOutput {
  conversationId: string;
  updatedAt: Date;
}
