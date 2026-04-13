import { IChatAttachment, IChatMessage } from '@/domain/entities/chat-message.entity';
import { IConversation } from '@/domain/entities/conversation.entity';
import { EConversationType } from '@/domain/enums/conversation.enum';
import { IBlockRepository } from '@/domain/repositories/block/block.repository';
import { IChatMessageRepository } from '@/domain/repositories/chat-message/chat-message.repository';
import { IConversationMemberRepository } from '@/domain/repositories/conversation-member/conversation-member.repository';
import { IConversationRepository } from '@/domain/repositories/conversation/conversation.repository';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';

import { decodeMessageCursor, encodeMessageCursor } from '@/application/common/cursor-codec/conversation.cursor-codec';
import { decodeCursorOrThrow } from '@/application/common/cursor-codec/cursor-decoder.codec';
import { SharedConversationsService } from '@/application/common/use-cases/shared-conversation.service';
import {
  ListMessagesPayloadDTO,
  MarkChatReadPayloadDTO,
  SendChatMessagePayloadDTO
} from '@/application/dtos/chat-message/chat-message.payload.dto';
import {
  ChatMessageResultDTO,
  ChatMessagesPaginationResultDTO
} from '@/application/dtos/chat-message/chat-message.result.dto';
import {
  ChatAttachmentTooLargeException,
  ChatConversationNotFoundException,
  ChatInvalidCursorException,
  ChatMessageEmptyException,
  ConversationMessageForbiddenException
} from '@/application/errors/chat-message.error';
import { IChatMessagesService } from '@/application/ports/chat-message.port';
import { INotificationsService } from '@/application/ports/notification.port';
import { IRealtimeChatEmitter } from '@/application/ports/realtime-emitter.port';

/** Max attachment size per file 5MB */
export const CHAT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

export class ChatMessagesService extends SharedConversationsService implements IChatMessagesService {
  private realtimeChatEmitter: IRealtimeChatEmitter | null = null;

  constructor(
    private readonly conversationRepository: IConversationRepository,
    protected readonly conversationMemberRepository: IConversationMemberRepository,
    private readonly chatMessageRepository: IChatMessageRepository,
    private readonly blockRepository: IBlockRepository,
    private readonly notificationsService: INotificationsService
  ) {
    super(conversationMemberRepository);
  }

  public bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void {
    this.realtimeChatEmitter = emitter;
  }

  private validateAttachments(att?: IChatAttachment[]) {
    if (!att?.length) return;
    for (const a of att) {
      if (a.size > CHAT_ATTACHMENT_MAX_BYTES) {
        throw ChatAttachmentTooLargeException;
      }
    }
  }

  /**
   * - Với chat 1-1 (DIRECT), không cho gửi nếu hai bên đã block nhau (một hoặc hai chiều).
   * - Tại sao: Product rule: block = không tiếp tục trò chuyện qua app. assertMember chỉ nói “có trong phòng”; rule block là thêm một lớp → 403 CONVERSATION_MESSAGE_FORBIDDEN.
   * - Tại sao chỉ DIRECT trong code hiện tại: Nhóm có thể vẫn gửi được trong phòng dù có block cặp đôi (logic notify/realtime xử lý riêng ở dưới).
   */
  private async assertCanSend(viewerUserId: string, conv: IConversation) {
    if (conv.type === EConversationType.DIRECT) {
      const peer = this.directPeer(conv, viewerUserId);
      if (await this.blockRepository.isBlockedEitherWay({ aUserId: viewerUserId, bUserId: peer })) {
        throw ConversationMessageForbiddenException;
      }
    }
  }

  /**
   * Nghiệp vụ tổng thể:
   * Đây là một lần user bấm gửi tin trong một conversation:
   * - Server phải xác nhận người gửi được phép.
   * - Kiểm tra nội dung hợp lệ, lưu tin + cập nhật hội thoại.
   * - Đẩy realtime cho mọi người trong phòng.
   * - Tạo thông báo (notification) cho người cần nhận.
   */
  async sendMessage({
    userId,
    conversationId,
    text,
    attachments
  }: SendChatMessagePayloadDTO): Promise<ChatMessageResultDTO> {
    // Người gửi phải là thành viên của conversation.
    await this.assertMember(conversationId, userId);

    // Conversation phải tồn tại trong DB.
    const conv = await this.conversationRepository.findConversationById({ id: conversationId });
    if (!conv) {
      throw ChatConversationNotFoundException;
    }

    // Kiểm tra có thể gửi tin direct được không.
    await this.assertCanSend(userId, conv);

    // Kiểm tra nội dung (text và file attachments) hợp lệ (không để trống).
    this.validateAttachments(attachments);

    if ((!text || text.length === 0) && (!attachments || attachments.length === 0)) {
      throw ChatMessageEmptyException;
    }

    // Lưu tin vào DB.
    const message = await this.chatMessageRepository.createMessage({
      conversationId,
      senderId: userId,
      text,
      attachments
    });
    // Cập nhật lại thời gian cập nhật của conversation.
    await this.conversationRepository.touchUpdatedAt({ id: conversationId, updatedAt: message.createdAt });

    // Lấy danh sách thành viên trong conversation.
    const membersInConversation = await this.conversationMemberRepository.listMembers({ conversationId });
    const memberIds = membersInConversation.map((m) => m.userId);

    const dto = new ChatMessageResultDTO({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      text: message.text,
      attachments: message.attachments,
      createdAt: message.createdAt.toISOString()
    });

    // Đẩy realtime cho mọi người trong phòng.
    if (this.realtimeChatEmitter) {
      this.realtimeChatEmitter.emitMessageCreated(conversationId, memberIds, dto);
    }

    const recipientIds: string[] = [];
    // Với chat 1-1 (DIRECT), chỉ tạo thông báo cho người cần nhận nếu không bị block.
    // (assertCanSend ở trên đã gọi isBlockedEitherWay với peer — không cần gọi lại ở đây.)
    if (conv.type === EConversationType.DIRECT) {
      recipientIds.push(this.directPeer(conv, userId));
    } else {
      // Với chat nhóm (GROUP), tạo thông báo cho tất cả thành viên trong conversation ngoại trừ người gửi.
      // Một lần lấy mọi user có cạnh block với sender (listUserIdsBlockedInEitherDirection), tránh N lần isBlockedEitherWay trong vòng lặp.

      const { ids } = await this.blockRepository.listUserIdsBlockedInEitherDirection({ viewerUserId: userId });
      const blockedWithSender = new Set(ids);
      for (const m of membersInConversation) {
        const memberId = m.userId;
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
        message,
        senderUserId: userId,
        recipientUserIds: recipientIds
      });
    }

    return dto;
  }

  /**
   * Nghiệp vụ tổng thể:
   * - Đọc lịch sử tin nhắn trong một cuộc hội thoại theo trang (pagination).
   * - Sử dụng cursor để phân trang.
   * - Luôn có kiểm tra quyền: chỉ thành viên của conversation mới được xem tin.
   */
  async listMessages({
    userId,
    conversationId,
    limit,
    cursor
  }: ListMessagesPayloadDTO): Promise<ChatMessagesPaginationResultDTO> {
    // Người xem phải là thành viên của conversation.
    await this.assertMember(conversationId, userId);

    const before: DateIdCursor | undefined = decodeCursorOrThrow(
      cursor,
      decodeMessageCursor,
      ChatInvalidCursorException
    );

    // Lấy số tin nhắn trên mỗi trang (giới hạn 100).
    const page = Math.min(100, Math.max(1, limit));
    // Lấy một bản ghi dư: nếu trả về > page phần tử → chắc chắn còn tin cũ hơn (hasMore).
    const rows = await this.chatMessageRepository.findMessages({ conversationId, limit: page + 1, before });
    const hasMore = rows.length > page;
    // Chỉ trả đúng page tin cho client, bỏ bản thừa dùng để detect hasMore.
    const messages = rows.slice(0, page);
    // nếu hasMore và messages không rỗng → encode từ tin cuối trong messages (tin cũ nhất trong trang hiện tại — vì sort giảm dần, phần tử cuối mảng là tin cũ nhất trong batch).
    // Lần gọi sau client gửi nextCursor → server lại findPageBeforeCursor(..., before) → load tiếp block tin cũ hơn nữa.
    const nextCursor =
      hasMore && messages.length > 0
        ? encodeMessageCursor(messages[messages.length - 1].createdAt, messages[messages.length - 1].id)
        : null;

    const items = messages.map(
      (m) =>
        new ChatMessageResultDTO({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          text: m.text,
          attachments: m.attachments,
          createdAt: m.createdAt.toISOString()
        })
    );

    return new ChatMessagesPaginationResultDTO(items, nextCursor);
  }

  async markRead({ userId, conversationId, lastReadMessageId }: MarkChatReadPayloadDTO): Promise<void> {
    // Người xem phải là thành viên của conversation.
    await this.assertMember(conversationId, userId);

    let msg: IChatMessage;
    let messageId: string;
    if (lastReadMessageId) {
      // client cung cấp messageId đã đọc. (client báo “tôi đã scroll/đọc tới tin này”)
      messageId = lastReadMessageId;
      // Kiểm tra messageId có hợp lệ không.
      // messageId phải tồn tại và thuộc conversationId, tránh case bị xoá hoặc gửi tin ngoài conversation.
      const found = await this.chatMessageRepository.findMessageById({ id: messageId });
      if (!found || found.conversationId !== conversationId) {
        throw ChatConversationNotFoundException;
      }
      msg = found;
    } else {
      // Lấy 1 tin nhắn mới nhất trong conversation.
      const latest = await this.chatMessageRepository.findMessages({ conversationId, limit: 1, before: undefined });
      if (!latest.length) {
        return;
      }
      msg = latest[0];
      messageId = msg.id;
      // Kiểm tra messageId có hợp lệ không.
      // messageId phải tồn tại và thuộc conversationId, tránh case bị xoá hoặc gửi tin ngoài conversation.
      if (msg.conversationId !== conversationId) {
        throw ChatConversationNotFoundException;
      }
    }

    // Cập nhật thời gian đọc cuối cùng của người xem.
    const at = msg.createdAt;
    // Cập nhật thời gian đọc cuối cùng của người xem trong conversationMember.
    const updated = await this.conversationMemberRepository.updateReadState({
      conversationId,
      userId,
      lastReadMessageId: messageId,
      lastReadAt: at
    });
    if (!updated) {
      return;
    }

    if (this.realtimeChatEmitter) {
      // Lấy danh sách thành viên trong conversation.
      const membersInConversation = await this.conversationMemberRepository.listMembers({ conversationId });
      const memberIds = membersInConversation.map((m) => m.userId);
      // Đẩy realtime cho mọi người trong phòng.
      this.realtimeChatEmitter.emitReadUpdated(conversationId, memberIds, userId, {
        lastReadMessageId: messageId,
        lastReadAt: at.toISOString()
      });
    }
  }
}
