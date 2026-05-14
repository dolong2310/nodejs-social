import {
  ConversationMemberProps,
  CreateConversationMemberProps
} from '@/modules/conversation/domain/entities/conversation-member.type';

export interface FindMemberInput extends Pick<ConversationMemberProps, 'conversationId' | 'userId'> {}

export interface FindMembersByUsersInput extends Pick<ConversationMemberProps, 'conversationId'> {
  userIds: string[];
}

export interface FindMembersInput extends Pick<ConversationMemberProps, 'userId'> {
  conversationIds: string[];
}

export interface CreateMemberInput extends CreateConversationMemberProps {}

export interface DeleteMemberInput extends Pick<ConversationMemberProps, 'conversationId' | 'userId'> {}

export interface UpdateRoleInput extends Pick<ConversationMemberProps, 'conversationId' | 'userId' | 'role'> {}

export interface TransferAdminRoleInput extends Pick<ConversationMemberProps, 'conversationId' | 'joinedAt'> {
  oldAdminUserId: string;
  newAdminUserId: string;
}

export interface UpdateReadStateInput extends Pick<
  ConversationMemberProps,
  'conversationId' | 'userId' | 'lastReadMessageId' | 'lastReadAt'
> {}
