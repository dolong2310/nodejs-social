import type { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import {
  type LeaveConversationInputPort,
  LeaveConversationPort,
  type LeaveConversationOutputPort
} from '@/modules/notification/application/use-cases/realtime/leave-conversation/leave-conversation.port';

export class LeaveConversationUseCase extends LeaveConversationPort {
  constructor(private readonly conversationMemberRepository: ConversationMemberRepositoryPort) {
    super();
  }

  async execute(input: LeaveConversationInputPort): Promise<LeaveConversationOutputPort | null> {
    const { userId, conversationId } = input;
    if (!conversationId || !isValidId(conversationId)) return null;

    const member = await this.conversationMemberRepository.findMember({ userId, conversationId }).catch(() => null);
    if (!member) return null;

    return { conversationId };
  }
}
