import { ConversationEntity } from '@/domain/entities/conversation/conversation.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import {
  ICreateGroupConversationInput,
  ITouchUpdatedAtInput,
  IUpdateConversationInput
} from '@/domain/repositories/conversation/conversation.repository.type';

export interface ConversationRepositoryPort extends RepositoryPort<ConversationEntity> {
  findConversationById(id: string): Promise<ConversationEntity | null>;
  findConversationsByIds(ids: string[]): Promise<ConversationEntity[]>;
  findDirectConversationByUserPair(userIdA: string, userIdB: string): Promise<ConversationEntity | null>;
  createDirectConversation(createdBy: string, peerId: string): Promise<ConversationEntity | null>;
  createGroupConversation(data: ICreateGroupConversationInput): Promise<ConversationEntity>;
  updateConversation(id: string, data: IUpdateConversationInput): Promise<ConversationEntity | null>;
  touchUpdatedAt(id: string, data: ITouchUpdatedAtInput): Promise<void>;
}
