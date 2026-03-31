import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import {
  ChatMessageResponseDTO,
  ChatMessagesPageResponseDTO,
  EConversationType,
  IBlockRepository,
  IChatAttachment,
  IChatMessage,
  IChatMessageRepository,
  IConversation,
  IConversationMemberRepository,
  IConversationRepository,
  INotificationsService,
  MarkChatReadBodyDTO,
  SendChatMessageBodyDTO,
  toChatMessageDto
} from '@/modules';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/providers';
import { SharedConversationsService } from '@/shared';
import { decodeMessageCursor, encodeMessageCursor } from '@/utils';

export interface IRealtimeChatEmitter {
  emitMessageCreated(conversationIdHex: string, memberUserIdHexes: string[], message: ChatMessageResponseDTO): void;
  emitReadUpdated(
    conversationIdHex: string,
    memberUserIdHexes: string[],
    viewerUserIdHex: string,
    payload: { lastReadMessageId: string; lastReadAt: string }
  ): void;
}

/** Max attachment size per file (D-14) — 5 MiB */
export const CHAT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

export interface IChatMessagesService {
  bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void;
  sendMessage(userId: string, conversationId: string, body: SendChatMessageBodyDTO): Promise<ChatMessageResponseDTO>;
  listMessages(
    userId: string,
    conversationId: string,
    limit: number,
    cursor?: string
  ): Promise<ChatMessagesPageResponseDTO>;
  markRead(userId: string, conversationId: string, body: MarkChatReadBodyDTO): Promise<void>;
}

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
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_ATTACHMENT_TOO_LARGE);
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
      if (await this.blockRepository.isBlockedEitherWay(viewerUserId, peer)) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_MESSAGE_FORBIDDEN);
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
  async sendMessage(
    userId: string,
    conversationId: string,
    body: SendChatMessageBodyDTO
  ): Promise<ChatMessageResponseDTO> {
    // Người gửi phải là thành viên của conversation.
    await this.assertMember(conversationId, userId);

    // Conversation phải tồn tại trong DB.
    const conv = await this.conversationRepository.findById(conversationId);
    if (!conv) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
    }

    // Kiểm tra có thể gửi tin direct được không.
    await this.assertCanSend(userId, conv);

    // Kiểm tra nội dung (text và file attachments) hợp lệ (không để trống).
    const text = body.text?.trim();
    const attachments = body.attachments;
    this.validateAttachments(attachments);

    if ((!text || text.length === 0) && (!attachments || attachments.length === 0)) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_MESSAGE_EMPTY);
    }

    // Lưu tin vào DB.
    const msg = await this.chatMessageRepository.insertMessage(conversationId, userId, text || undefined, attachments);
    // Cập nhật lại thời gian cập nhật của conversation.
    await this.conversationRepository.touchUpdatedAt(conversationId, msg.createdAt);

    // Chuyển đổi thành DTO để trả về client.
    const dto = toChatMessageDto(msg);

    // Lấy danh sách thành viên trong conversation.
    const membersInConversation = await this.conversationMemberRepository.listMembers(conversationId);
    const memberIds = membersInConversation.map((m) => m.userId.toHexString());

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
      const blockedWithSender = new Set(await this.blockRepository.listUserIdsBlockedInEitherDirection(userId));
      for (const m of membersInConversation) {
        const memberId = m.userId.toHexString();
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
      await this.notificationsService.recordNewMessage(msg, userId, recipientIds);
    }

    return dto;
  }

  /**
   * Nghiệp vụ tổng thể:
   * - Đọc lịch sử tin nhắn trong một cuộc hội thoại theo trang (pagination).
   * - Sử dụng cursor để phân trang.
   * - Luôn có kiểm tra quyền: chỉ thành viên của conversation mới được xem tin.
   */
  async listMessages(
    userId: string,
    conversationId: string,
    limit: number,
    cursor?: string
  ): Promise<ChatMessagesPageResponseDTO> {
    // Người xem phải là thành viên của conversation.
    await this.assertMember(conversationId, userId);

    let before: { createdAt: Date; _id: string } | undefined;
    if (cursor) {
      try {
        // Decode chuỗi cursor (base64url JSON { t: timestamp, i: messageId }) thành { createdAt, _id } — điểm neo “tin cũ nhất trong trang trước”.
        // Vì sao: Repository cần thời gian + _id để truy vấn ổn định khi nhiều tin cùng createdAt (trùng millisecond).
        before = decodeMessageCursor(cursor);
      } catch {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
      }
    }

    // Lấy số tin nhắn trên mỗi trang (giới hạn 100).
    const page = Math.min(100, Math.max(1, limit));
    // Lấy một bản ghi dư: nếu trả về > page phần tử → chắc chắn còn tin cũ hơn (hasMore).
    const rows = await this.chatMessageRepository.findPageBeforeCursor(conversationId, page + 1, before);
    const hasMore = rows.length > page;
    // Chỉ trả đúng page tin cho client, bỏ bản thừa dùng để detect hasMore.
    const messages = rows.slice(0, page);
    // nếu hasMore và messages không rỗng → encode từ tin cuối trong messages (tin cũ nhất trong trang hiện tại — vì sort giảm dần, phần tử cuối mảng là tin cũ nhất trong batch).
    // Lần gọi sau client gửi nextCursor → server lại findPageBeforeCursor(..., before) → load tiếp block tin cũ hơn nữa.
    const next =
      hasMore && messages.length > 0
        ? encodeMessageCursor(messages[messages.length - 1].createdAt, messages[messages.length - 1]._id.toHexString())
        : null;

    return {
      messages: messages.map(toChatMessageDto),
      nextCursor: next
    };
  }

  async markRead(userId: string, conversationId: string, body: MarkChatReadBodyDTO): Promise<void> {
    const { lastReadMessageId } = body;

    // Người xem phải là thành viên của conversation.
    await this.assertMember(conversationId, userId);

    let msg: IChatMessage;
    let messageId: string;
    if (lastReadMessageId) {
      // client cung cấp messageId đã đọc. (client báo “tôi đã scroll/đọc tới tin này”)
      messageId = lastReadMessageId;
      // Kiểm tra messageId có hợp lệ không.
      // messageId phải tồn tại và thuộc conversationId, tránh case bị xoá hoặc gửi tin ngoài conversation.
      const found = await this.chatMessageRepository.findById(messageId);
      if (!found || found.chatId.toHexString() !== conversationId) {
        throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
      }
      msg = found;
    } else {
      // Lấy 1 tin nhắn mới nhất trong conversation.
      const latest = await this.chatMessageRepository.findPageBeforeCursor(conversationId, 1, undefined);
      if (!latest.length) {
        return;
      }
      msg = latest[0];
      messageId = msg._id.toHexString();
      // Kiểm tra messageId có hợp lệ không.
      // messageId phải tồn tại và thuộc conversationId, tránh case bị xoá hoặc gửi tin ngoài conversation.
      if (msg.chatId.toHexString() !== conversationId) {
        throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
      }
    }

    // Cập nhật thời gian đọc cuối cùng của người xem.
    const at = msg.createdAt;
    // Cập nhật thời gian đọc cuối cùng của người xem trong conversationMember.
    const updated = await this.conversationMemberRepository.updateReadState(conversationId, userId, messageId, at);
    if (!updated) {
      return;
    }

    if (this.realtimeChatEmitter) {
      // Lấy danh sách thành viên trong conversation.
      const membersInConversation = await this.conversationMemberRepository.listMembers(conversationId);
      const memberIds = membersInConversation.map((m) => m.userId.toHexString());
      // Đẩy realtime cho mọi người trong phòng.
      this.realtimeChatEmitter.emitReadUpdated(conversationId, memberIds, userId, {
        lastReadMessageId: messageId,
        lastReadAt: at.toISOString()
      });
    }
  }
}
