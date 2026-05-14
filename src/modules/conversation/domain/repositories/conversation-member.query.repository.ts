import {
  ListConversationsForUserInput,
  ListConversationsForUserOutput
} from '@/modules/conversation/domain/repositories/conversation-member.query.type';

export interface ConversationMemberQueryRepositoryPort {
  listConversationsForUser(data: ListConversationsForUserInput): Promise<ListConversationsForUserOutput[]>;
}
