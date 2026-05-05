import {
  GetConversationPresenceCommand,
  GetConversationPresencePort
} from '@/modules/notification/application/use-cases/realtime/get-conversation-presence/get-conversation-presence.port';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';

export class GetConversationPresenceUseCase extends GetConversationPresencePort {
  constructor(private readonly conversationMemberRepository: ConversationMemberRepositoryPort) {
    super();
  }

  async execute({ conversationId }: GetConversationPresenceCommand): Promise<string[]> {
    const memberEntities = await this.conversationMemberRepository.listMembers(conversationId).catch(() => []);
    const memberIds = memberEntities.map((m) => m.toObject().userId);
    return memberIds;
  }
}
