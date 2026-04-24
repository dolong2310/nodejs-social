import { ConversationRoleForbiddenException } from '@/application/exceptions/conversation.exception';
import { IConversationService } from '@/application/services/conversation/conversation.service';
import {
  UpdateConversationCommand,
  UpdateConversationInPort,
  UpdateConversationResult
} from '@/application/use-cases/conversation/update-conversation/update-conversation.in-port';
import { EConversationMemberRole } from '@/domain/entities/conversation-member/conversation-member.type';
import { ConversationEntity } from '@/domain/entities/conversation/conversation.entity';
import { EConversationType } from '@/domain/entities/conversation/conversation.type';
import { ConversationRepositoryPort } from '@/domain/repositories/conversation/conversation.repository';

/**
 * Cập nhật thông tin cuộc trò chuyện
 * Sửa metadata của cuộc trò chuyện (ví dụ đổi name, đổi avatarMediaId) có phân quyền theo role trong conversation
 */
export class UpdateConversationInteractor extends UpdateConversationInPort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationService: IConversationService
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
      throw ConversationRoleForbiddenException;
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
