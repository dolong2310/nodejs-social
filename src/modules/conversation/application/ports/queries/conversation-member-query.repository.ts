import {
  IListConversationsForUserInput,
  IListConversationsForUserOutput
} from '@/modules/conversation/application/ports/queries/conversation-member-query.type';

export interface ConversationMemberQueryRepositoryPort {
  listConversationsForUser(data: IListConversationsForUserInput): Promise<IListConversationsForUserOutput[]>;
}
