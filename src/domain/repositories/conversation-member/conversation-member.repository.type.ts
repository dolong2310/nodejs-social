import {
  ConversationMemberProps,
  CreateConversationMemberProps
} from '@/domain/entities/conversation-member/conversation-member.type';

export interface IFindMemberInput extends Pick<ConversationMemberProps, 'conversationId' | 'userId'> {}

export interface IFindMembersByUsersInput extends Pick<ConversationMemberProps, 'conversationId'> {
  userIds: string[];
}

export interface IFindMembersInput extends Pick<ConversationMemberProps, 'userId'> {
  conversationIds: string[];
}

export interface ICreateMemberInput extends CreateConversationMemberProps {}

export interface IDeleteMemberInput extends Pick<ConversationMemberProps, 'conversationId' | 'userId'> {}

export interface IUpdateRoleInput extends Pick<ConversationMemberProps, 'conversationId' | 'userId' | 'role'> {}

export interface ITransferAdminRoleInput extends Pick<ConversationMemberProps, 'conversationId' | 'joinedAt'> {
  oldAdminUserId: string;
  newAdminUserId: string;
}

export interface IUpdateReadStateInput extends Pick<
  ConversationMemberProps,
  'conversationId' | 'userId' | 'lastReadMessageId' | 'lastReadAt'
> {}
