import { IChatMessage } from '@/domain/entities/chat-message.entity';
import {
  ICreateMessageInput,
  IFindMessageByIdInput,
  IFindMessagesInput
} from '@/domain/repositories/chat-message/chat-message.interface';

export interface IChatMessageRepository {
  createMessage(data: ICreateMessageInput): Promise<IChatMessage>;
  findMessageById(data: IFindMessageByIdInput): Promise<IChatMessage | null>;
  findMessages(data: IFindMessagesInput): Promise<IChatMessage[]>;
}
