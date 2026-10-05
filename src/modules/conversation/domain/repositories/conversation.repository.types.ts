import type { ConversationProps } from '@/modules/conversation/domain/entities/conversation.types';

export interface CreateGroupConversationInput extends Pick<ConversationProps, 'name' | 'createdBy'> {
  memberIds: string[];
}

export interface UpdateConversationInput extends Pick<ConversationProps, 'name' | 'avatarMediaId'> {}

export interface TouchUpdatedAtInput {
  updatedAt: Date;
}
