import { ChatMessageEntity } from '@/modules/conversation/domain/entities/chat-message.entity';
import {
  ICreateMessageInput,
  IFindMessagesInput
} from '@/modules/conversation/domain/repositories/chat-message.repository.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface ChatMessageRepositoryPort extends RepositoryPort<ChatMessageEntity> {
  createMessage(data: ICreateMessageInput): Promise<ChatMessageEntity>;
  findMessageById(id: string): Promise<ChatMessageEntity | null>;
  findMessages(id: string, data: IFindMessagesInput): Promise<ChatMessageEntity[]>;
}
