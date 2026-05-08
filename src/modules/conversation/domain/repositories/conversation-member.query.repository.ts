import {
  IListConversationsForUserInput,
  IListConversationsForUserOutput
} from '@/modules/conversation/domain/repositories/conversation-member.query.type';

export interface ConversationMemberQueryRepositoryPort {
  listConversationsForUser(data: IListConversationsForUserInput): Promise<IListConversationsForUserOutput[]>;
}
