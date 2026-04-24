import {
  AttachmentTooLargeException,
  ConversationNotFoundException,
  MessageEmptyException,
  MessageForbiddenException
} from '@/application/exceptions/conversation.exception';
import { RealtimePort } from '@/application/ports/realtime.port';
import { IConversationService } from '@/application/services/conversation/conversation.service';
import { INotificationsService } from '@/application/services/notification/notification.service';
import {
  SendMessageCommand,
  SendMessageInPort,
  SendMessageResult
} from '@/application/use-cases/chat-message/send-message/send-message.in-port';
import { IChatAttachment } from '@/domain/entities/chat-message/chat-message.type';
import { ConversationEntity } from '@/domain/entities/conversation/conversation.entity';
import { EConversationType } from '@/domain/entities/conversation/conversation.type';
import { BlockRepositoryPort } from '@/domain/repositories/block/block.repository';
import { ChatMessageRepositoryPort } from '@/domain/repositories/chat-message/chat-message.repository';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';
import { ConversationRepositoryPort } from '@/domain/repositories/conversation/conversation.repository';

/**
 * Nghiệp vụ tổng thể:
 * Đây là một lần user bấm gửi tin trong một conversation:
 * - Server phải xác nhận người gửi được phép.
 * - Kiểm tra nội dung hợp lệ, lưu tin + cập nhật hội thoại.
 * - Đẩy realtime cho mọi người trong phòng.
 * - Tạo thông báo (notification) cho người cần nhận.
 */
export class SendMessageInteractor extends SendMessageInPort {
  private readonly CHAT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly chatMessageRepository: ChatMessageRepositoryPort,
    private readonly blockRepository: BlockRepositoryPort,
    private readonly notificationsService: INotificationsService,
    private readonly conversationService: IConversationService,
    private readonly realtimeEmitter: RealtimePort
  ) {
    super();
  }

  async execute({ userId, conversationId, text, attachments }: SendMessageCommand): Promise<SendMessageResult> {
    // Người gửi phải là thành viên của conversation.
    await this.conversationService.isMember({ conversationId, userId });

    // Conversation phải tồn tại trong DB.
    const convEntity = await this.conversationRepository.findConversationById(conversationId);
    if (!convEntity) {
      throw ConversationNotFoundException;
    }

    // Kiểm tra có thể gửi tin direct được không.
    await this.assertCanSend(userId, convEntity);

    // Kiểm tra nội dung (text và file attachments) hợp lệ (không để trống).
    this.validateAttachments(attachments);

    if ((!text || text.length === 0) && (!attachments || attachments.length === 0)) {
      throw MessageEmptyException;
    }

    // Lưu tin vào DB.
    const messageEntity = await this.chatMessageRepository.createMessage({
      conversationId,
      senderId: userId,
      text,
      attachments
    });
    const message = messageEntity.toObject();
    // Cập nhật lại thời gian cập nhật của conversation.
    await this.conversationRepository.touchUpdatedAt(conversationId, { updatedAt: message.createdAt });

    // Lấy danh sách thành viên trong conversation.
    const membersInConversation = await this.conversationMemberRepository.listMembers(conversationId);
    const memberIds = membersInConversation.map((m) => m.getProps().userId);

    const dto = new SendMessageResult({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      text: message.text,
      attachments: message.attachments,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    });

    // Đẩy realtime cho mọi người trong phòng.
    if (this.realtimeEmitter) {
      this.realtimeEmitter.emitMessageCreated(conversationId, memberIds, dto);
    }

    const recipientIds: string[] = [];
    // Với chat 1-1 (DIRECT), chỉ tạo thông báo cho người cần nhận nếu không bị block.
    // (assertCanSend ở trên đã gọi isBlockedEitherWay với peer — không cần gọi lại ở đây.)
    if (convEntity.getProps().type === EConversationType.DIRECT) {
      recipientIds.push(this.conversationService.getDirectPeerId({ conv: convEntity, userId }));
    } else {
      // Với chat nhóm (GROUP), tạo thông báo cho tất cả thành viên trong conversation ngoại trừ người gửi.
      // Một lần lấy mọi user có cạnh block với sender (listUserIdsBlockedInEitherDirection), tránh N lần isBlockedEitherWay trong vòng lặp.

      const ids = await this.blockRepository.listUserIdsBlockedInEitherDirection(userId);
      const blockedWithSender = new Set(ids);
      for (const member of membersInConversation) {
        const memberId = member.getProps().userId;
        // Nếu memberId là người gửi, không tạo thông báo.
        if (memberId === userId) continue;
        // Nếu người gửi đã block thành viên này, không tạo thông báo.
        if (blockedWithSender.has(memberId)) continue;
        // Thêm thành viên này vào danh sách người nhận thông báo.
        recipientIds.push(memberId);
      }
    }

    // Nếu có người nhận thông báo, tạo thông báo (notification).
    if (recipientIds.length > 0) {
      await this.notificationsService.recordNewMessage({
        message: messageEntity,
        senderUserId: userId,
        recipientUserIds: recipientIds
      });
    }

    return dto;
  }

  /**
   * - Với chat 1-1 (DIRECT), không cho gửi nếu hai bên đã block nhau (một hoặc hai chiều).
   * - Tại sao: Product rule: block = không tiếp tục trò chuyện qua app. isMember chỉ nói "có trong phòng"; rule block là thêm một lớp => 403 CONVERSATION_MESSAGE_FORBIDDEN.
   * - Tại sao chỉ DIRECT trong code hiện tại: Nhóm có thể vẫn gửi được trong phòng dù có block cặp đôi (logic notify/realtime xử lý riêng ở dưới).
   */
  private async assertCanSend(userId: string, conv: ConversationEntity) {
    if (conv.getProps().type === EConversationType.DIRECT) {
      const peerId = this.conversationService.getDirectPeerId({ conv, userId });
      if (await this.blockRepository.isBlockedEitherWay(userId, peerId)) {
        throw MessageForbiddenException;
      }
    }
  }

  private validateAttachments(att?: IChatAttachment[]) {
    if (!att?.length) return;
    for (const a of att) {
      if (a.size > this.CHAT_ATTACHMENT_MAX_BYTES) {
        throw AttachmentTooLargeException;
      }
    }
  }
}
