import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import {
  JoinConversationInputPort,
  JoinConversationPort,
  JoinConversationOutputPort
} from '@/modules/notification/application/use-cases/realtime/join-conversation/join-conversation.port';

export class JoinConversationUseCase extends JoinConversationPort {
  constructor(private readonly conversationMemberRepository: ConversationMemberRepositoryPort) {
    super();
  }

  async execute(input: JoinConversationInputPort): Promise<JoinConversationOutputPort | null> {
    const { userId, conversationId } = input;
    if (!conversationId || !isValidId(conversationId)) return null;

    const member = await this.conversationMemberRepository.findMember({ userId, conversationId }).catch(() => null);
    if (!member) return null;

    return new JoinConversationOutputPort({ conversationId });
  }
}
