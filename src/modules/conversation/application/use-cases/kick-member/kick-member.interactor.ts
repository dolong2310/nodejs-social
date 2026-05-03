import {
  ConversationCannotKickMemberException,
  ConversationDirectNoKickException,
  ConversationNotMemberException
} from '@/modules/conversation/application/conversation.exception';
import { UserNotFoundException } from '@/modules/user/application/user.exception';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  KickMemberCommand,
  KickMemberInPort
} from '@/modules/conversation/application/use-cases/kick-member/kick-member.in-port';
import { EConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { EConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';

/**
 * Đuổi thành viên khỏi group
 * - Chỉ áp dụng cho group (không kick được trong chat direct 1-1).
 * - Người thực hiện (actor = userId) phải là MANAGER hoặc ADMIN.
 * - Không cho kick chính mình (việc tự rời group là nghiệp vụ khác: leaveConversation).
 * - Không cho kick ADMIN.
 * - MANAGER chỉ được kick MEMBER (không kick được MANAGER/ADMIN). ADMIN thì kick được MEMBER và MANAGER (nhưng vẫn không kick ADMIN).
 */
export class KickMemberInteractor extends KickMemberInPort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: ConversationServicePort
  ) {
    super();
  }

  async execute({ userId, conversationId, targetUserId }: KickMemberCommand): Promise<void> {
    // kiểm tra conversation có phải là group không
    const convEntity = await this.conversationService.loadConversation(conversationId);
    if (convEntity.getProps().type === EConversationType.DIRECT) {
      throw new ConversationDirectNoKickException();
    }

    // không cho kick chính mình
    if (targetUserId === userId) {
      throw new ConversationCannotKickMemberException();
    }

    // Gom 1 query để lấy membership của actor (người thực hiện) + target (người bị kick) (giảm query so với findMembership 2 lần).
    const memberEntities = await this.conversationMemberRepository.findMembersByUsers({
      conversationId,
      userIds: [userId, targetUserId]
    });
    const members = memberEntities.map((m) => m.toObject());
    const actor = members.find((m) => m.userId === userId);
    const target = members.find((m) => m.userId === targetUserId);

    // kiểm tra user có phải là member của conversation không
    if (!actor) {
      throw new ConversationNotMemberException();
    }
    // kiểm tra người bị kick có phải là member của conversation không
    if (!target) {
      throw new UserNotFoundException();
    }

    // kiểm tra quyền của người thực hiện
    if (actor.role === EConversationMemberRole.MEMBER) {
      throw new ConversationCannotKickMemberException();
    }
    // không cho kick ADMIN
    if (target.role === EConversationMemberRole.ADMIN) {
      throw new ConversationCannotKickMemberException();
    }
    // ADMIN thì kick được MEMBER và MANAGER (không kick được ADMIN).
    // MANAGER chỉ được kick MEMBER (không kick được MANAGER/ADMIN).
    if (actor.role === EConversationMemberRole.MANAGER) {
      if (target.role !== EConversationMemberRole.MEMBER) {
        throw new ConversationCannotKickMemberException();
      }
    }

    const deletedCount = await this.conversationMemberRepository.deleteMember({ conversationId, userId: targetUserId });
    // chỉ khi xóa thực sự xảy ra (tránh write thừa trong race condition).
    if (deletedCount > 0) {
      // cập nhật updatedAt của conversation (vì cần hiển thị message "kick member" trong danh sách messages)
      await this.conversationRepository.touchUpdatedAt(conversationId, { updatedAt: new Date() });
    }
  }
}
