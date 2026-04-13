import {
  ListMessagesPayloadDTO,
  MarkChatReadPayloadDTO,
  SendChatMessagePayloadDTO
} from '@/application/dtos/chat-message/chat-message.payload.dto';
import {
  ChatMessageResultDTO,
  ChatMessagesPaginationResultDTO
} from '@/application/dtos/chat-message/chat-message.result.dto';
import { IRealtimeChatEmitter } from '@/application/ports/realtime-emitter.port';

export interface IChatMessagesService {
  bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void;
  sendMessage(payload: SendChatMessagePayloadDTO): Promise<ChatMessageResultDTO>;
  listMessages(payload: ListMessagesPayloadDTO): Promise<ChatMessagesPaginationResultDTO>;
  markRead(payload: MarkChatReadPayloadDTO): Promise<void>;
}
