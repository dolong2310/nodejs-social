import type {
  ListConversationsForUserInput,
  ListConversationsForUserOutput
} from '@/modules/conversation/domain/repositories/conversation-member.query.types';

export interface ConversationMemberQueryRepositoryPort {
  listConversationsForUser(data: ListConversationsForUserInput): Promise<ListConversationsForUserOutput[]>;
}
