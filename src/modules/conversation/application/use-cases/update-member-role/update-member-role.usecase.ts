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
 * Update member permissions in a group.
 * - Applies only to groups; direct 1-1 chats cannot change roles.
 * - Only ADMIN can change roles.
 * - ADMIN cannot be modified, and this endpoint cannot set a role to ADMIN.
 * - ADMIN can change MEMBER and MANAGER permissions.
 * - Only switching between MEMBER and MANAGER is allowed:
 * + If target is MANAGER, it can only be downgraded to MEMBER.
 * + If target is MEMBER, it can only be upgraded to MANAGER.
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
    // Check whether the conversation is a group.
    const convEntity = await this.conversationService.loadConversation(conversationId);
    const conv = convEntity.toObject();
    if (conv.type !== EnumConversationType.GROUP) {
      throw new ConversationNotFoundException();
    }

    // Use one query to fetch actor and target memberships, reducing DB round trips.
    const membershipEntities = await this.conversationMemberRepository.findMembersByUsers({
      conversationId,
      userIds: [userId, targetUserId]
    });
    const memberships = membershipEntities.map((member) => member.toObject());
    const actor = memberships.find((m) => m.userId === userId);
    const target = memberships.find((m) => m.userId === targetUserId);
    // Check whether the user is a conversation member and ADMIN.
    if (!actor) {
      throw new ConversationNotMemberException();
    }
    if (actor.role !== EnumConversationMemberRole.ADMIN) {
      throw new ConversationRoleForbiddenException();
    }
    // Check whether the target is a conversation member and not ADMIN.
    if (!target) {
      throw new UserNotFoundException();
    }
    if (target.role === EnumConversationMemberRole.ADMIN) {
      throw new ConversationRoleForbiddenException();
    }

    // Check whether the new role is MEMBER or MANAGER.
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

    // Update the target member role.
    await this.conversationMemberRepository.updateRole({ conversationId, userId: targetUserId, role: nextRole });
    // Load conversation members.
    const memberEntities = await this.conversationMemberRepository.listMembers(conversationId);
    // Return conversation detail with updated members.
    return this.conversationService.mapConversationDetail({ userId, conv: convEntity, members: memberEntities });
  }
}
