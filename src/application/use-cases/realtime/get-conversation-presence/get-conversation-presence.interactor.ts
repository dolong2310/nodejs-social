import {
  GetConversationPresenceCommand,
  GetConversationPresenceInPort
} from '@/application/use-cases/realtime/get-conversation-presence/get-conversation-presence.in-port';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';

export class GetConversationPresenceInteractor extends GetConversationPresenceInPort {
  constructor(private readonly conversationMemberRepository: ConversationMemberRepositoryPort) {
    super();
  }

  async execute({ conversationId }: GetConversationPresenceCommand): Promise<string[]> {
    const memberEntities = await this.conversationMemberRepository.listMembers(conversationId).catch(() => []);
    const memberIds = memberEntities.map((m) => m.toObject().userId);
    return memberIds;
  }
}
