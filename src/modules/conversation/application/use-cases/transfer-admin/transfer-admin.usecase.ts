import {
  ConversationNotFoundException,
  ConversationNotMemberException,
  ConversationRoleForbiddenException
} from '@/modules/conversation/application/exceptions/conversation.exception';
import type { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  type TransferAdminInputPort,
  TransferAdminPort,
  type TransferAdminOutputPort
} from '@/modules/conversation/application/use-cases/transfer-admin/transfer-admin.port';
import { EnumConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.types';
import { EnumConversationType } from '@/modules/conversation/domain/entities/conversation.types';
import type { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';

/**
 * Transfer admin ownership to another member.
 * - Applies only to groups; direct 1-1 chats cannot transfer admin ownership.
 * - The actor (userId) must be ADMIN.
 * - The new admin must be a conversation member.
 * - Admin ownership cannot be transferred to yourself.
 */
export class TransferAdminUseCase extends TransferAdminPort {
  constructor(
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: ConversationServicePort
  ) {
    super();
  }

  async execute(input: TransferAdminInputPort): Promise<TransferAdminOutputPort> {
    const { userId, newAdminUserId, conversationId } = input;
    // Check whether the conversation is a group.
    const convEntity = await this.conversationService.loadConversation(conversationId);
    const conv = convEntity.toObject();
    if (conv.type !== EnumConversationType.GROUP) {
      throw new ConversationNotFoundException();
    }

    // Do not allow transferring admin ownership to yourself.
    if (newAdminUserId === userId) {
      throw new ConversationRoleForbiddenException();
    }

    // Use one query to fetch actor and new-admin memberships, reducing DB round trips.
    const membershipEntities = await this.conversationMemberRepository.findMembersByUsers({
      conversationId,
      userIds: [userId, newAdminUserId]
    });
    const memberships = membershipEntities.map((member) => member.toObject());
    const actor = memberships.find((m) => m.userId === userId);
    const newAdmin = memberships.find((m) => m.userId === newAdminUserId);

    // Check whether the user is a conversation member and ADMIN.
    if (!actor) {
      throw new ConversationNotMemberException();
    }
    if (actor.role !== EnumConversationMemberRole.ADMIN) {
      throw new ConversationRoleForbiddenException();
    }

    // Check whether the new admin is a conversation member.
    if (!newAdmin) {
      throw new UserNotFoundException();
    }

    const updatedAt = new Date();
    await this.conversationMemberRepository.transferAdminRole({
      conversationId,
      oldAdminUserId: userId,
      newAdminUserId,
      joinedAt: updatedAt
    });

    // Return conversation detail with updated members.
    const memberEntities = await this.conversationMemberRepository.listMembers(conversationId);
    convEntity.updatedAt = updatedAt;
    return this.conversationService.mapConversationDetail({
      userId,
      conv: convEntity,
      members: memberEntities
    });
  }
}
