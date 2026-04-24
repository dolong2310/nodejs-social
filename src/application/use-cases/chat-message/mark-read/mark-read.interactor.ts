import { ConversationNotFoundException } from '@/application/exceptions/conversation.exception';
import { RealtimePort } from '@/application/ports/realtime.port';
import { IConversationService } from '@/application/services/conversation/conversation.service';
import { MarkReadCommand, MarkReadInPort } from '@/application/use-cases/chat-message/mark-read/mark-read.in-port';
import { ChatMessageEntity } from '@/domain/entities/chat-message/chat-message.entity';
import { ChatMessageRepositoryPort } from '@/domain/repositories/chat-message/chat-message.repository';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';

export class MarkReadInteractor extends MarkReadInPort {
  constructor(
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly chatMessageRepository: ChatMessageRepositoryPort,
    private readonly conversationService: IConversationService,
    private readonly realtimeEmitter: RealtimePort
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
        throw ConversationNotFoundException;
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
        throw ConversationNotFoundException;
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
