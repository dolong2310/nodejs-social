import { DateIdCursor } from '@/modules/common/domain/value-objects/cursor.value-object';
import { CreateChatMessageProps } from '@/modules/conversation/domain/entities/chat-message.type';

export interface CreateMessageInput extends CreateChatMessageProps {}

export interface FindMessagesInput {
  limit: number;
  before?: DateIdCursor;
}
