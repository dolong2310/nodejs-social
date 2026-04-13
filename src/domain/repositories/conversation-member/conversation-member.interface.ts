import { ConversationMemberEntity } from '@/domain/entities/conversation-member.entity';

export interface IFindMemberInput extends Pick<ConversationMemberEntity, 'conversationId' | 'userId'> {}

export interface IFindMembersByUsersInput extends Pick<ConversationMemberEntity, 'conversationId'> {
  userIds: string[];
}

export interface IFindMembersInput extends Pick<ConversationMemberEntity, 'userId'> {
  conversationIds: string[];
}

export interface ICreateMemberInput extends Pick<ConversationMemberEntity, 'conversationId' | 'userId' | 'role'> {}

export interface IDeleteMemberInput extends Pick<ConversationMemberEntity, 'conversationId' | 'userId'> {}

export interface IListMembersInput extends Pick<ConversationMemberEntity, 'conversationId'> {}

export interface ICountAdminsInput extends Pick<ConversationMemberEntity, 'conversationId'> {}

export interface IUpdateRoleInput extends Pick<ConversationMemberEntity, 'conversationId' | 'userId' | 'role'> {}

export interface ITransferAdminRoleInput extends Pick<ConversationMemberEntity, 'conversationId' | 'joinedAt'> {
  oldAdminUserId: string;
  newAdminUserId: string;
}

export interface IUpdateReadStateInput extends Pick<
  ConversationMemberEntity,
  'conversationId' | 'userId' | 'lastReadMessageId' | 'lastReadAt'
> {}

export interface ICountMembersInput extends Pick<ConversationMemberEntity, 'conversationId'> {}

export interface IListConversationsForUserInput {
  userId: string;
  limit: number;
  cursor?: { conversationId: string; updatedAt: Date };
}

export interface IListConversationsForUserOutput {
  conversationId: string;
  updatedAt: Date;
}
