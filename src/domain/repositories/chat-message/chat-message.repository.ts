import { ChatMessageEntity } from '@/domain/entities/chat-message/chat-message.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import {
  ICreateMessageInput,
  IFindMessagesInput
} from '@/domain/repositories/chat-message/chat-message.repository.type';

export interface ChatMessageRepositoryPort extends RepositoryPort<ChatMessageEntity> {
  createMessage(data: ICreateMessageInput): Promise<ChatMessageEntity>;
  findMessageById(id: string): Promise<ChatMessageEntity | null>;
  findMessages(id: string, data: IFindMessagesInput): Promise<ChatMessageEntity[]>;
}
