import { ConversationNotFoundException } from '@/modules/conversation/application/conversation.exception';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  MarkReadCommand,
  MarkReadPort
} from '@/modules/conversation/application/use-cases/mark-read-message/mark-read-message.port';
import { ChatMessageEntity } from '@/modules/conversation/domain/entities/chat-message.entity';
import { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { RealtimeEmitterPort } from '@/modules/core/application/ports/realtime-emitter.port';

export class MarkReadUseCase extends MarkReadPort {
  constructor(
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly chatMessageRepository: ChatMessageRepositoryPort,
    private readonly conversationService: ConversationServicePort,
    private readonly realtimeEmitter: RealtimeEmitterPort
  ) {
    super();
  }

  async execute({ userId, conversationId, lastReadMessageId }: MarkReadCommand): Promise<void> {
    // Người xem phải là thành viên của conversation.
    await this.conversationService.isMember({ conversationId, userId });

    let messageEntity: ChatMessageEntity;
    let messageId: string;
    if (lastReadMessageId) {
      // client cung cấp messageId đã đọc. (client báo “tôi đã scroll/đọc tới tin này”)
      messageId = lastReadMessageId;
      // Kiểm tra messageId có hợp lệ không.
      // messageId phải tồn tại và thuộc conversationId, tránh case bị xoá hoặc gửi tin ngoài conversation.
      const entity = await this.chatMessageRepository.findMessageById(messageId);
      if (!entity || entity.getProps().conversationId !== conversationId) {
        throw new ConversationNotFoundException();
      }
      messageEntity = entity;
    } else {
      // Lấy 1 tin nhắn mới nhất trong conversation.
      const entities = await this.chatMessageRepository.findMessages(conversationId, { limit: 1, before: undefined });
      if (!entities.length) return;
      messageEntity = entities[0];
      messageId = messageEntity.id.toString();
      // Kiểm tra messageId có hợp lệ không.
      // messageId phải tồn tại và thuộc conversationId, tránh case bị xoá hoặc gửi tin ngoài conversation.
      if (messageEntity.getProps().conversationId !== conversationId) {
        throw new ConversationNotFoundException();
      }
    }

    // Cập nhật thời gian đọc cuối cùng của người xem.
    const lastReadAt = messageEntity.createdAt;
    // Cập nhật thời gian đọc cuối cùng của người xem trong conversationMember.
    const updated = await this.conversationMemberRepository.updateReadState({
      conversationId,
      userId,
      lastReadMessageId: messageId,
      lastReadAt
    });
    if (!updated) return;

    if (this.realtimeEmitter) {
      // Lấy danh sách thành viên trong conversation.
      const membersInConversation = await this.conversationMemberRepository.listMembers(conversationId);
      const memberIds = membersInConversation.map((m) => m.getProps().userId);
      // Đẩy realtime cho mọi người trong phòng.
      this.realtimeEmitter.emitReadUpdated(conversationId, memberIds, userId, {
        lastReadMessageId: messageId,
        lastReadAt: lastReadAt.toISOString()
      });
    }
  }
}
