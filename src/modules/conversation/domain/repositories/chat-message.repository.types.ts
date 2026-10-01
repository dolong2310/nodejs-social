import type { DateIdCursor } from '@/modules/common/domain/value-objects/cursor.value-object';
import type { CreateChatMessageProps } from '@/modules/conversation/domain/entities/chat-message.types';

export interface CreateMessageInput extends CreateChatMessageProps {}

export interface FindMessagesInput {
  limit: number;
  before?: DateIdCursor;
}
