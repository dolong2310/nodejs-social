import { DateIdCursor } from '@/modules/common/domain/value-objects/date-id-cursor.value-object';
import { CreateChatMessageProps } from '@/modules/conversation/domain/entities/chat-message.type';

export interface ICreateMessageInput extends CreateChatMessageProps {}

export interface IFindMessagesInput {
  limit: number;
  before?: DateIdCursor;
}
