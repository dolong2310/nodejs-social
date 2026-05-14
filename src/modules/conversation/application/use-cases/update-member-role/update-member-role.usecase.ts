import {
  ConversationNotFoundException,
  ConversationNotMemberException,
  ConversationRoleForbiddenException
} from '@/modules/conversation/application/exceptions/conversation.exception';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  UpdateMemberRoleCommand,
  UpdateMemberRolePort,
  UpdateMemberRoleResult
} from '@/modules/conversation/application/use-cases/update-member-role/update-member-role.port';
import { EnumConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { EnumConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';

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
export class UpdateMemberRoleUseCase extends UpdateMemberRolePort {
  constructor(
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: ConversationServicePort
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
    if (conv.type !== EnumConversationType.GROUP) {
      throw new ConversationNotFoundException();
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
      throw new ConversationNotMemberException();
    }
    if (actor.role !== EnumConversationMemberRole.ADMIN) {
      throw new ConversationRoleForbiddenException();
    }
    // kiểm tra người bị đổi role có phải là member của conversation không và có phải là ADMIN không
    if (!target) {
      throw new UserNotFoundException();
    }
    if (target.role === EnumConversationMemberRole.ADMIN) {
      throw new ConversationRoleForbiddenException();
    }

    // kiểm tra role mới có phải là MEMBER hoặc MANAGER không
    const nextRole = role;
    if (nextRole === EnumConversationMemberRole.ADMIN) {
      throw new ConversationRoleForbiddenException();
    }
    if (target.role === EnumConversationMemberRole.MANAGER && nextRole !== EnumConversationMemberRole.MEMBER) {
      throw new ConversationRoleForbiddenException();
    }
    if (target.role === EnumConversationMemberRole.MEMBER && nextRole !== EnumConversationMemberRole.MANAGER) {
      throw new ConversationRoleForbiddenException();
    }

    // cập nhật role của người bị đổi role
    await this.conversationMemberRepository.updateRole({ conversationId, userId: targetUserId, role: nextRole });
    // lấy members của conversation
    const memberEntities = await this.conversationMemberRepository.listMembers(conversationId);
    // trả về chi tiết cuộc trò chuyện với members đã cập nhật
    return this.conversationService.mapConversationDetail({ userId, conv: convEntity, members: memberEntities });
  }
}
