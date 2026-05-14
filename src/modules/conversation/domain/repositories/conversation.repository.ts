import { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import {
  CreateGroupConversationInput,
  TouchUpdatedAtInput,
  UpdateConversationInput
} from '@/modules/conversation/domain/repositories/conversation.repository.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface ConversationRepositoryPort extends RepositoryPort<ConversationEntity> {
  findConversationById(id: string): Promise<ConversationEntity | null>;
  findConversationsByIds(ids: string[]): Promise<ConversationEntity[]>;
  findDirectConversationByUserPair(userIdA: string, userIdB: string): Promise<ConversationEntity | null>;
  createDirectConversation(createdBy: string, peerId: string): Promise<ConversationEntity | null>;
  createGroupConversation(data: CreateGroupConversationInput): Promise<ConversationEntity>;
  updateConversation(id: string, data: UpdateConversationInput): Promise<ConversationEntity | null>;
  touchUpdatedAt(id: string, data: TouchUpdatedAtInput): Promise<void>;
}
