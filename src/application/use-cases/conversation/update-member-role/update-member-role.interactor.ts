import {
  ConversationNotFoundException,
  ConversationNotMemberException,
  ConversationRoleForbiddenException
} from '@/application/exceptions/conversation.exception';
import { UserNotFoundException } from '@/application/exceptions/user.exception';
import { IConversationService } from '@/application/services/conversation/conversation.service';
import {
  UpdateMemberRoleCommand,
  UpdateMemberRoleInPort,
  UpdateMemberRoleResult
} from '@/application/use-cases/conversation/update-member-role/update-member-role.in-port';
import { EConversationMemberRole } from '@/domain/entities/conversation-member/conversation-member.type';
import { EConversationType } from '@/domain/entities/conversation/conversation.type';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';

/**
 * Cập nhật quyền thành viên trong group
 * - Chỉ áp dụng cho group (không cho phép thay đổi quyền trong chat direct 1-1).
 * - Chỉ ADMIN mới được đổi role.
 * - Không cho đụng tới ADMIN (không đổi role của ADMIN và cũng không cho set role thành ADMIN bằng endpoint này).
 * - ADMIN thì có thể thay đổi quyền của MEMBER và MANAGER.
 * - Chỉ cho “đổi qua lại” giữa MEMBER và MANAGER:
 * + Nếu target đang là MANAGER thì chỉ được hạ xuống MEMBER.
 * + Nếu target đang là MEMBER thì chỉ được nâng lên MANAGER.
 */
export class UpdateMemberRoleInteractor extends UpdateMemberRoleInPort {
  constructor(
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: IConversationService
  ) {
    super();
  }

  async execute({
    userId,
    conversationId,
    targetUserId,
    role
  }: UpdateMemberRoleCommand): Promise<UpdateMemberRoleResult> {
    // kiểm tra conversation có phải là group không
    const convEntity = await this.conversationService.loadConversation(conversationId);
    const conv = convEntity.toObject();
    if (conv.type !== EConversationType.GROUP) {
      throw ConversationNotFoundException;
    }

    // gom 1 query để lấy membership của actor + target (giảm round-trip DB).
    const membershipEntities = await this.conversationMemberRepository.findMembersByUsers({
      conversationId,
      userIds: [userId, targetUserId]
    });
    const memberships = membershipEntities.map((member) => member.toObject());
    const actor = memberships.find((m) => m.userId === userId);
    const target = memberships.find((m) => m.userId === targetUserId);
    // kiểm tra user có phải là member của conversation không và có phải là ADMIN không
    if (!actor) {
      throw ConversationNotMemberException;
    }
    if (actor.role !== EConversationMemberRole.ADMIN) {
      throw ConversationRoleForbiddenException;
    }
    // kiểm tra người bị đổi role có phải là member của conversation không và có phải là ADMIN không
    if (!target) {
      throw UserNotFoundException;
    }
    if (target.role === EConversationMemberRole.ADMIN) {
      throw ConversationRoleForbiddenException;
    }

    // kiểm tra role mới có phải là MEMBER hoặc MANAGER không
    const nextRole = role;
    if (nextRole === EConversationMemberRole.ADMIN) {
      throw ConversationRoleForbiddenException;
    }
    if (target.role === EConversationMemberRole.MANAGER && nextRole !== EConversationMemberRole.MEMBER) {
      throw ConversationRoleForbiddenException;
    }
    if (target.role === EConversationMemberRole.MEMBER && nextRole !== EConversationMemberRole.MANAGER) {
      throw ConversationRoleForbiddenException;
    }

    // cập nhật role của người bị đổi role
    await this.conversationMemberRepository.updateRole({ conversationId, userId: targetUserId, role: nextRole });
    // lấy members của conversation
    const memberEntities = await this.conversationMemberRepository.listMembers(conversationId);
    // trả về chi tiết cuộc trò chuyện với members đã cập nhật
    return this.conversationService.mapConversationDetail({ userId, conv: convEntity, members: memberEntities });
  }
}
