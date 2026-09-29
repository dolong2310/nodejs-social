import {
  ConversationCannotKickMemberException,
  ConversationDirectNoKickException,
  ConversationNotMemberException
} from '@/modules/conversation/application/exceptions/conversation.exception';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  KickMemberInputPort,
  KickMemberPort
} from '@/modules/conversation/application/use-cases/kick-member/kick-member.port';
import { EnumConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { EnumConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';

/**
 * Kick a member from a group.
 * - Applies only to groups; direct 1-1 chats cannot kick members.
 * - The actor (userId) must be MANAGER or ADMIN.
 * - Users cannot kick themselves; leaving a group is handled by leaveConversation.
 * - ADMIN cannot be kicked.
 * - MANAGER can kick only MEMBER. ADMIN can kick MEMBER and MANAGER, but still cannot kick ADMIN.
 */
export class KickMemberUseCase extends KickMemberPort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: ConversationServicePort
  ) {
    super();
  }

  async execute(input: KickMemberInputPort): Promise<void> {
    const { userId, conversationId, targetUserId } = input;
    // Check whether the conversation is a group.
    const convEntity = await this.conversationService.loadConversation(conversationId);
    if (convEntity.getProps().type === EnumConversationType.DIRECT) {
      throw new ConversationDirectNoKickException();
    }

    // Do not allow kicking yourself.
    if (targetUserId === userId) {
      throw new ConversationCannotKickMemberException();
    }

    // Use one query to fetch actor and target memberships, reducing queries compared with two findMembership calls.
    const memberEntities = await this.conversationMemberRepository.findMembersByUsers({
      conversationId,
      userIds: [userId, targetUserId]
    });
    const members = memberEntities.map((m) => m.toObject());
    const actor = members.find((m) => m.userId === userId);
    const target = members.find((m) => m.userId === targetUserId);

    // Check whether the user is a conversation member.
    if (!actor) {
      throw new ConversationNotMemberException();
    }
    // Check whether the target is a conversation member.
    if (!target) {
      throw new UserNotFoundException();
    }

    // Check actor permissions.
    if (actor.role === EnumConversationMemberRole.MEMBER) {
      throw new ConversationCannotKickMemberException();
    }
    // Do not allow kicking ADMIN.
    if (target.role === EnumConversationMemberRole.ADMIN) {
      throw new ConversationCannotKickMemberException();
    }
    // ADMIN can kick MEMBER and MANAGER, but not ADMIN.
    // MANAGER can kick only MEMBER, not MANAGER/ADMIN.
    if (actor.role === EnumConversationMemberRole.MANAGER) {
      if (target.role !== EnumConversationMemberRole.MEMBER) {
        throw new ConversationCannotKickMemberException();
      }
    }

    const deletedCount = await this.conversationMemberRepository.deleteMember({ conversationId, userId: targetUserId });
    // Only continue when deletion actually happened, avoiding extra writes during race conditions.
    if (deletedCount > 0) {
      // Update conversation.updatedAt so the "kick member" message can appear correctly in message lists.
      await this.conversationRepository.touchUpdatedAt(conversationId, { updatedAt: new Date() });
    }
  }
}
