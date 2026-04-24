import { ConversationRoleForbiddenException } from '@/application/exceptions/conversation.exception';
import { IConversationService } from '@/application/services/conversation/conversation.service';
import {
  LeaveConversationCommand,
  LeaveConversationInPort
} from '@/application/use-cases/conversation/leave-conversation/leave-conversation.in-port';
import { EConversationMemberRole } from '@/domain/entities/conversation-member/conversation-member.type';
import { EConversationType } from '@/domain/entities/conversation/conversation.type';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';

export class LeaveConversationInteractor extends LeaveConversationInPort {
  constructor(
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: IConversationService
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
        throw ConversationRoleForbiddenException;
      }
    }

    await this.conversationMemberRepository.deleteMember({ conversationId, userId });
  }
}
