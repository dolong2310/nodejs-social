import { CreateChatMessageProps } from '@/modules/conversation/domain/entities/chat-message.type';
import { DateIdCursor } from '@/modules/core/domain/value-objects/date-id-cursor.value-object';

export interface ICreateMessageInput extends CreateChatMessageProps {}

export interface IFindMessagesInput {
  limit: number;
  before?: DateIdCursor;
}
