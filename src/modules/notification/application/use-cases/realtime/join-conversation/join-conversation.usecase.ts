import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import {
  JoinConversationCommand,
  JoinConversationPort,
  JoinConversationResult
} from '@/modules/notification/application/use-cases/realtime/join-conversation/join-conversation.port';

export class JoinConversationUseCase extends JoinConversationPort {
  constructor(private readonly conversationMemberRepository: ConversationMemberRepositoryPort) {
    super();
  }

  async execute({ userId, conversationId }: JoinConversationCommand): Promise<JoinConversationResult | null> {
    if (!conversationId || !isValidId(conversationId)) return null;

    const member = await this.conversationMemberRepository.findMember({ userId, conversationId }).catch(() => null);
    if (!member) return null;

    return new JoinConversationResult({ conversationId });
  }
}
