import { CreateChatMessageProps } from '@/domain/entities/chat-message/chat-message.type';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';

export interface ICreateMessageInput extends CreateChatMessageProps {}

export interface IFindMessagesInput {
  limit: number;
  before?: DateIdCursor;
}
