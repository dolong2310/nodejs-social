import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  GetMessagesPort,
  GetMessagesQuery,
  GetMessagesResult
} from '@/modules/conversation/application/use-cases/get-messages/get-messages.port';
import { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';

/**
 * Nghiệp vụ tổng thể:
 * - Đọc lịch sử tin nhắn trong một cuộc hội thoại theo trang (pagination).
 * - Sử dụng cursor để phân trang.
 * - Luôn có kiểm tra quyền: chỉ thành viên của conversation mới được xem tin.
 */
export class GetMessagesUseCase extends GetMessagesPort {
  constructor(
    private readonly chatMessageRepository: ChatMessageRepositoryPort,
    private readonly conversationService: ConversationServicePort
  ) {
    super();
  }

  async execute({ userId, conversationId, limit, cursor }: GetMessagesQuery): Promise<GetMessagesResult> {
    // Người xem phải là thành viên của conversation.
    await this.conversationService.isMember({ conversationId, userId });

    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);

    // Lấy số tin nhắn trên mỗi trang (giới hạn 100).
    const page = Math.min(100, Math.max(1, limit));
    // Lấy một bản ghi dư: nếu trả về > page phần tử => chắc chắn còn tin cũ hơn (hasMore).
    const messageEntities = await this.chatMessageRepository.findMessages(conversationId, { limit: page + 1, before });
    const messages = messageEntities.map((m) => m.toObject());
    const hasMore = messages.length > page;
    // Chỉ trả đúng page tin cho client, bỏ bản thừa dùng để detect hasMore.
    const items = messages.slice(0, page);
    // nếu hasMore và messages không rỗng => encode từ tin cuối trong messages (tin cũ nhất trong trang hiện tại — vì sort giảm dần, phần tử cuối mảng là tin cũ nhất trong batch).
    // Lần gọi sau client gửi nextCursor => server lại findPageBeforeCursor(..., before) => load tiếp block tin cũ hơn nữa.
    const last = items[items.length - 1];
    const nextCursor = hasMore && items.length > 0 ? encodeCursor(last.createdAt, last.id) : null;

    return new GetMessagesResult(items, nextCursor);
  }
}
