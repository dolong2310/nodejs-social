import { ConversationRoleForbiddenException } from '@/modules/conversation/application/exceptions/conversation.exception';
import type { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  type UpdateConversationInputPort,
  UpdateConversationPort,
  type UpdateConversationOutputPort
} from '@/modules/conversation/application/use-cases/update-conversation/update-conversation.port';
import { EnumConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.types';
import type { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import { EnumConversationType } from '@/modules/conversation/domain/entities/conversation.types';
import type { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';

/**
 * Update conversation information.
 * Edit conversation metadata, such as name or avatarMediaId, with role-based permissions inside the conversation.
 */
export class UpdateConversationUseCase extends UpdateConversationPort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationService: ConversationServicePort
  ) {
    super();
  }

  async execute(input: UpdateConversationInputPort): Promise<UpdateConversationOutputPort> {
    const { userId, conversationId, avatarMediaId, name } = input;
    // Check whether the user is a conversation member.
    const self = (await this.conversationService.isMember({ conversationId, userId })).toObject();
    // Only admin and manager can edit conversation metadata.
    if (self.role === EnumConversationMemberRole.MEMBER) {
      throw new ConversationRoleForbiddenException();
    }

    // Patch object containing changes to apply.
    const patch: Partial<{ name: string; avatarMediaId: string | null; updatedAt: Date }> = {};
    if (name !== undefined) {
      patch.name = name;
    }
    if (avatarMediaId !== undefined) {
      patch.avatarMediaId = avatarMediaId || null; // accept string or null; skip undefined
    }
    // If the patch object has no changes, return the current conversation.
    if (Object.keys(patch).length === 0) {
      const convEntity = await this.conversationService.loadConversation(conversationId);
      const conv = convEntity.toObject();

      const payload: UpdateConversationOutputPort = {
        id: conv.id,
        type: conv.type,
        createdBy: conv.createdBy,
        name: conv.name,
        avatarMediaId: conv.avatarMediaId ?? null,
        peerUserId: this.conversationService.getDirectPeerId({ conv: convEntity, userId }),
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt
      };

      if (conv.type === EnumConversationType.DIRECT) {
        payload.peerUserId = this.conversationService.getDirectPeerId({ conv: convEntity, userId });
      }

      return payload;
    }

    // Update conversation.
    let convEntity: ConversationEntity | null;
    convEntity = await this.conversationRepository.updateConversation(conversationId, {
      avatarMediaId: patch.avatarMediaId,
      name: patch.name
    });
    if (!convEntity) {
      convEntity = await this.conversationService.loadConversation(conversationId);
    }
    const conv = convEntity.toObject();

    const payload: UpdateConversationOutputPort = {
      id: conv.id,
      type: conv.type,
      createdBy: conv.createdBy,
      name: conv.name,
      avatarMediaId: conv.avatarMediaId ?? null,
      updatedAt: conv.updatedAt,
      createdAt: conv.createdAt
    };

    if (conv.type === EnumConversationType.DIRECT) {
      payload.peerUserId = this.conversationService.getDirectPeerId({ conv: convEntity, userId });
    }

    return payload;
  }
}
