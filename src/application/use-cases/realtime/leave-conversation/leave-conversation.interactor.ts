import {
  LeaveConversationCommand,
  LeaveConversationInPort,
  LeaveConversationResult
} from '@/application/use-cases/realtime/leave-conversation/leave-conversation.in-port';
import { isValidId } from '@/domain/helpers/ids';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';

export class LeaveConversationInteractor extends LeaveConversationInPort {
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
