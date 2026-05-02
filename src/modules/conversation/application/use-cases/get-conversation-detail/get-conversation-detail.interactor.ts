import { IConversationService } from '@/modules/conversation/application/services/conversation.service';
import {
  GetConversationDetailInPort,
  GetConversationDetailQuery,
  GetConversationDetailResult
} from '@/modules/conversation/application/use-cases/get-conversation-detail/get-conversation-detail.in-port';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';

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
