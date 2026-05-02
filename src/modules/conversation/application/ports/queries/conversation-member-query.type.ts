import { ConversationMemberProps } from '@/modules/conversation/domain/entities/conversation-member.type';
import { DateIdCursor } from '@/modules/common/domain/value-objects/date-id-cursor.value-object';

export interface IListConversationsForUserInput extends Pick<ConversationMemberProps, 'userId'> {
  limit: number;
  cursor?: DateIdCursor;
}

export interface IListConversationsForUserOutput {
  conversationId: string;
  updatedAt: Date;
}
