import { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import {
  ICreateGroupConversationInput,
  ITouchUpdatedAtInput,
  IUpdateConversationInput
} from '@/modules/conversation/domain/repositories/conversation.repository.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface ConversationRepositoryPort extends RepositoryPort<ConversationEntity> {
  findConversationById(id: string): Promise<ConversationEntity | null>;
  findConversationsByIds(ids: string[]): Promise<ConversationEntity[]>;
  findDirectConversationByUserPair(userIdA: string, userIdB: string): Promise<ConversationEntity | null>;
  createDirectConversation(createdBy: string, peerId: string): Promise<ConversationEntity | null>;
  createGroupConversation(data: ICreateGroupConversationInput): Promise<ConversationEntity>;
  updateConversation(id: string, data: IUpdateConversationInput): Promise<ConversationEntity | null>;
  touchUpdatedAt(id: string, data: ITouchUpdatedAtInput): Promise<void>;
}
