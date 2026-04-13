import { IConversation } from '@/domain/entities/conversation.entity';
import {
  ICreateConversationInput,
  ICreateGroupConversationWithMembersInput,
  IFindConversationByIdInput,
  IFindConversationsByIdsInput,
  IFindDirectConversationByUserPairInput,
  ITouchUpdatedAtInput,
  IUpdateConversationInput
} from '@/domain/repositories/conversation/conversation.interface';

export interface IConversationRepository {
  findConversationById(data: IFindConversationByIdInput): Promise<IConversation | null>;
  findConversationsByIds(data: IFindConversationsByIdsInput): Promise<IConversation[]>;
  findDirectConversationByUserPair(data: IFindDirectConversationByUserPairInput): Promise<IConversation | null>;
  createConversation(data: ICreateConversationInput): Promise<IConversation | null>;
  createGroupConversationWithMembers(data: ICreateGroupConversationWithMembersInput): Promise<IConversation>;
  updateConversation(data: IUpdateConversationInput): Promise<IConversation | null>;
  touchUpdatedAt(data: ITouchUpdatedAtInput): Promise<void>;
}
