import { ChatMessageEntity } from '@/domain/entities/chat-message.entity';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';

export interface ICreateMessageInput extends Pick<
  ChatMessageEntity,
  'conversationId' | 'senderId' | 'text' | 'attachments'
> {}

export interface IFindMessageByIdInput extends Pick<ChatMessageEntity, 'id'> {}

export interface IFindMessagesInput {
  conversationId: string;
  limit: number;
  before?: DateIdCursor;
}
