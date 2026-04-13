import { ConversationEntity } from '@/domain/entities/conversation.entity';

export interface IFindConversationByIdInput extends Pick<ConversationEntity, 'id'> {}

export interface IFindConversationsByIdsInput {
  conversationIds: string[];
}

export interface IFindDirectConversationByUserPairInput {
  aUserId: string;
  bUserId: string;
}

export interface ICreateConversationInput extends Pick<ConversationEntity, 'createdBy'> {
  peerId: string;
}

export interface ICreateGroupConversationWithMembersInput {
  adminId: string;
  memberIds: string[];
  groupName?: string;
}

export interface IUpdateConversationInput extends Pick<
  ConversationEntity,
  'id' | 'name' | 'avatarMediaId' | 'updatedAt'
> {}

export interface ITouchUpdatedAtInput extends Pick<ConversationEntity, 'id' | 'updatedAt'> {
  // at?: Date;
}
