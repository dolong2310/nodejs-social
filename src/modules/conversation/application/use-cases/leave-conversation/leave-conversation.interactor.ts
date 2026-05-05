import { ConversationRoleForbiddenException } from '@/modules/conversation/application/conversation.exception';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  LeaveConversationCommand,
  LeaveConversationInPort
} from '@/modules/conversation/application/use-cases/leave-conversation/leave-conversation.in-port';
import { EConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { EConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';

export class LeaveConversationInteractor extends LeaveConversationInPort {
  constructor(
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: ConversationServicePort
  ) {
    super();
  }

  async execute({ userId, conversationId }: LeaveConversationCommand): Promise<void> {
    const self = (await this.conversationService.isMember({ conversationId, userId })).toObject();
    const conv = (await this.conversationService.loadConversation(conversationId)).toObject();

    // không cho phép "admin cuối cùng" rời khỏi group mà khiến group không còn admin nào.
    if (conv.type === EConversationType.GROUP && self.role === EConversationMemberRole.ADMIN) {
      const adminsCount = await this.conversationMemberRepository.countAdmins(conversationId);
      // nếu chỉ còn 1 admin thì không cho rời group
      if (adminsCount === 1) {
        throw new ConversationRoleForbiddenException();
      }
    }

    await this.conversationMemberRepository.deleteMember({ conversationId, userId });
  }
}
