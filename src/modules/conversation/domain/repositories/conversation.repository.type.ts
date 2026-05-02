import { ConversationProps } from '@/modules/conversation/domain/entities/conversation.type';

export interface ICreateGroupConversationInput extends Pick<ConversationProps, 'name' | 'createdBy'> {
  memberIds: string[];
}

export interface IUpdateConversationInput extends Pick<ConversationProps, 'name' | 'avatarMediaId'> {}

export interface ITouchUpdatedAtInput {
  updatedAt: Date;
}
