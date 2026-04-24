import { IConversationService } from '@/application/services/conversation/conversation.service';
import {
  GetConversationDetailInPort,
  GetConversationDetailQuery,
  GetConversationDetailResult
} from '@/application/use-cases/conversation/get-conversation-detail/get-conversation-detail.in-port';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';

export class GetConversationDetailInteractor extends GetConversationDetailInPort {
  constructor(
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: IConversationService
  ) {
    super();
  }

  async execute({ userId, conversationId }: GetConversationDetailQuery): Promise<GetConversationDetailResult> {
    await this.conversationService.isMember({ conversationId, userId });
    const [conv, members] = await Promise.all([
      this.conversationService.loadConversation(conversationId),
      this.conversationMemberRepository.listMembers(conversationId)
    ]);
    return this.conversationService.mapConversationDetail({ userId, conv, members });
  }
}
