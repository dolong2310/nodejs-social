import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import {
  LeaveConversationCommand,
  LeaveConversationPort,
  LeaveConversationResult
} from '@/modules/notification/application/use-cases/realtime/leave-conversation/leave-conversation.port';

export class LeaveConversationUseCase extends LeaveConversationPort {
  constructor(private readonly conversationMemberRepository: ConversationMemberRepositoryPort) {
    super();
  }

  async execute({ userId, conversationId }: LeaveConversationCommand): Promise<LeaveConversationResult | null> {
    if (!conversationId || !isValidId(conversationId)) return null;

    const member = await this.conversationMemberRepository.findMember({ userId, conversationId }).catch(() => null);
    if (!member) return null;

    return { conversationId };
  }
}
