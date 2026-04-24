import {
  IListConversationsForUserInput,
  IListConversationsForUserOutput
} from '@/application/queries/conversation-member/conversation-member-query.type';

export interface ConversationMemberQueryRepositoryPort {
  listConversationsForUser(data: IListConversationsForUserInput): Promise<IListConversationsForUserOutput[]>;
}
