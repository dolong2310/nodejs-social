import type { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import {
  type GetConversationPresenceInputPort,
  GetConversationPresencePort
} from '@/modules/notification/application/use-cases/realtime/get-conversation-presence/get-conversation-presence.port';

export class GetConversationPresenceUseCase extends GetConversationPresencePort {
  constructor(private readonly conversationMemberRepository: ConversationMemberRepositoryPort) {
    super();
  }

  async execute(input: GetConversationPresenceInputPort): Promise<string[]> {
    const memberEntities = await this.conversationMemberRepository.listMembers(input.conversationId).catch(() => []);
    const memberIds = memberEntities.map((m) => m.toObject().userId);
    return memberIds;
  }
}
