import {
  ConversationNotFoundException,
  ConversationNotMemberException,
  ConversationRoleForbiddenException
} from '@/application/exceptions/conversation.exception';
import { UserNotFoundException } from '@/application/exceptions/user.exception';
import { IConversationService } from '@/application/services/conversation/conversation.service';
import {
  TransferAdminCommand,
  TransferAdminInPort,
  TransferAdminResult
} from '@/application/use-cases/conversation/transfer-admin/transfer-admin.in-port';
import { EConversationMemberRole } from '@/domain/entities/conversation-member/conversation-member.type';
import { EConversationType } from '@/domain/entities/conversation/conversation.type';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';

/**
 * Chuyển quyền admin cho người khác
 * - Chỉ áp dụng cho group (không cho phép chuyển quyền admin trong chat direct 1-1).
 * - Người thực hiện (actor = userId) phải là ADMIN.
 * - Người mới nhận quyền admin phải là member của conversation.
 * - Không cho chuyển quyền admin cho chính mình.
 */
export class TransferAdminInteractor extends TransferAdminInPort {
  constructor(
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: IConversationService
  ) {
    super();
  }

  async execute({ userId, newAdminUserId, conversationId }: TransferAdminCommand): Promise<TransferAdminResult> {
    // kiểm tra conversation có phải là group không
    const convEntity = await this.conversationService.loadConversation(conversationId);
    const conv = convEntity.toObject();
    if (conv.type !== EConversationType.GROUP) {
      throw ConversationNotFoundException;
    }

    // không cho chuyển quyền admin cho chính mình
    if (newAdminUserId === userId) {
      throw ConversationRoleForbiddenException;
    }

    // gom 1 query để lấy membership của actor + người mới nhận quyền admin (giảm round-trip DB).
    const membershipEntities = await this.conversationMemberRepository.findMembersByUsers({
      conversationId,
      userIds: [userId, newAdminUserId]
    });
    const memberships = membershipEntities.map((member) => member.toObject());
    const actor = memberships.find((m) => m.userId === userId);
    const newAdmin = memberships.find((m) => m.userId === newAdminUserId);

    // kiểm tra user có phải là member của conversation không và có phải là ADMIN không
    if (!actor) {
      throw ConversationNotMemberException;
    }
    if (actor.role !== EConversationMemberRole.ADMIN) {
      throw ConversationRoleForbiddenException;
    }

    // kiểm tra người mới nhận quyền admin có phải là member của conversation không
    if (!newAdmin) {
      throw UserNotFoundException;
    }

    const updatedAt = new Date();
    await this.conversationMemberRepository.transferAdminRole({
      conversationId,
      oldAdminUserId: userId,
      newAdminUserId,
      joinedAt: updatedAt
    });

    // trả về chi tiết cuộc trò chuyện với members đã cập nhật
    const memberEntities = await this.conversationMemberRepository.listMembers(conversationId);
    convEntity.updatedAt = updatedAt;
    return this.conversationService.mapConversationDetail({
      userId,
      conv: convEntity,
      members: memberEntities
    });
  }
}
