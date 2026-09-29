import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  GetConversationDetailPort,
  GetConversationDetailInputPort,
  GetConversationDetailOutputPort
} from '@/modules/conversation/application/use-cases/get-conversation-detail/get-conversation-detail.port';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';

export class GetConversationDetailUseCase extends GetConversationDetailPort {
  constructor(
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: ConversationServicePort
  ) {
    super();
  }

  async execute(input: GetConversationDetailInputPort): Promise<GetConversationDetailOutputPort> {
    const { userId, conversationId } = input;
    await this.conversationService.isMember({ conversationId, userId });
    const [conv, members] = await Promise.all([
      this.conversationService.loadConversation(conversationId),
      this.conversationMemberRepository.listMembers(conversationId)
    ]);
    return this.conversationService.mapConversationDetail({ userId, conv, members });
  }
}
