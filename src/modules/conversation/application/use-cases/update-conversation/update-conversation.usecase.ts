import { ConversationRoleForbiddenException } from '@/modules/conversation/application/conversation.exception';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  UpdateConversationCommand,
  UpdateConversationPort,
  UpdateConversationResult
} from '@/modules/conversation/application/use-cases/update-conversation/update-conversation.port';
import { EConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import { EConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';

/**
 * Cập nhật thông tin cuộc trò chuyện
 * Sửa metadata của cuộc trò chuyện (ví dụ đổi name, đổi avatarMediaId) có phân quyền theo role trong conversation
 */
export class UpdateConversationUseCase extends UpdateConversationPort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationService: ConversationServicePort
  ) {
    super();
  }

  async execute({
    userId,
    conversationId,
    avatarMediaId,
    name
  }: UpdateConversationCommand): Promise<UpdateConversationResult> {
    // kiểm tra user có phải là member của conversation không
    const self = (await this.conversationService.isMember({ conversationId, userId })).toObject();
    // chỉ cho phép admin và manager được sửa metadata của conversation
    if (self.role === EConversationMemberRole.MEMBER) {
      throw new ConversationRoleForbiddenException();
    }

    // patch object chứa các thay đổi cần thực hiện
    const patch: Partial<{ name: string; avatarMediaId: string | null; updatedAt: Date }> = {};
    if (name !== undefined) {
      patch.name = name;
    }
    if (avatarMediaId !== undefined) {
      patch.avatarMediaId = avatarMediaId || null; // chấp nhận string hoặc null, undefined thì bỏ qua
    }
    // nếu patch object không có thay đổi gì thì trả về conversation hiện tại
    if (Object.keys(patch).length === 0) {
      const convEntity = await this.conversationService.loadConversation(conversationId);
      const conv = convEntity.toObject();

      const payload: UpdateConversationResult = {
        id: conv.id,
        type: conv.type,
        createdBy: conv.createdBy,
        name: conv.name,
        avatarMediaId: conv.avatarMediaId ?? null,
        peerUserId: this.conversationService.getDirectPeerId({ conv: convEntity, userId }),
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt
      };

      if (conv.type === EConversationType.DIRECT) {
        payload.peerUserId = this.conversationService.getDirectPeerId({ conv: convEntity, userId });
      }

      return payload;
    }

    // cập nhật conversation
    let convEntity: ConversationEntity | null;
    convEntity = await this.conversationRepository.updateConversation(conversationId, {
      avatarMediaId: patch.avatarMediaId,
      name: patch.name
    });
    if (!convEntity) {
      convEntity = await this.conversationService.loadConversation(conversationId);
    }
    const conv = convEntity.toObject();

    const payload: UpdateConversationResult = {
      id: conv.id,
      type: conv.type,
      createdBy: conv.createdBy,
      name: conv.name,
      avatarMediaId: conv.avatarMediaId ?? null,
      updatedAt: conv.updatedAt,
      createdAt: conv.createdAt
    };

    if (conv.type === EConversationType.DIRECT) {
      payload.peerUserId = this.conversationService.getDirectPeerId({ conv: convEntity, userId });
    }

    return payload;
  }
}
