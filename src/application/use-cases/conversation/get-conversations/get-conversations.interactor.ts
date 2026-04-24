import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/application/common/utils/cursor.util';
import { InvalidCursorException } from '@/application/exceptions/cursor.exception';
import { ConversationMemberQueryRepositoryPort } from '@/application/queries/conversation-member/conversation-member-query.repository';
import { IConversationService } from '@/application/services/conversation/conversation.service';
import {
  ConversationItem,
  GetConversationsInPort,
  GetConversationsQuery,
  GetConversationsResult
} from '@/application/use-cases/conversation/get-conversations/get-conversations.in-port';
import { EConversationType } from '@/domain/entities/conversation/conversation.type';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';
import { ConversationRepositoryPort } from '@/domain/repositories/conversation/conversation.repository';

export class GetConversationsInteractor extends GetConversationsInPort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationMemberQueryRepository: ConversationMemberQueryRepositoryPort,
    private readonly conversationService: IConversationService
  ) {
    super();
  }

  async execute({ userId, limit, cursor }: GetConversationsQuery): Promise<GetConversationsResult> {
    const decoded = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);

    // giới hạn kích thước trang trong khoảng an toàn (1-100), tránh gửi limit quá lớn.
    const page = Math.min(100, Math.max(1, limit));
    // lấy danh sách phòng chat (conversations) của user
    const results = await this.conversationMemberQueryRepository.listConversationsForUser({
      userId,
      limit: page + 1,
      cursor: decoded
    });
    const hasMore = results.length > page;
    const slice = results.slice(0, page);
    const last = slice[slice.length - 1];
    const nextCursor =
      // Nếu còn dữ liệu, mã hóa updatedAt và conversationId của phần tử cuối trong slice làm cursor cho request phân trang sau.
      hasMore && slice.length > 0 ? encodeCursor(last.updatedAt, last.conversationId) : null;

    const ids = slice.map((r) => r.conversationId);
    const uniqueIds = Array.from(new Set(ids));

    const [convEntities, membershipEntities] = await Promise.all([
      this.conversationRepository.findConversationsByIds(uniqueIds),
      this.conversationMemberRepository.findMembers({ conversationIds: uniqueIds, userId })
    ]);

    const convById = new Map(
      convEntities.map((entity) => {
        const conv = entity.toObject();
        return [conv.id, entity];
      })
    );
    const memberChatIds = new Set(membershipEntities.map((entity) => entity.getProps().conversationId));

    const conversations: ConversationItem[] = [];
    for (const row of slice) {
      const convId = row.conversationId;
      // Kiểm tra phòng chat có tồn tại không
      const convEntity = convById.get(convId);
      if (!convEntity) continue;
      // Tương đương với isMember(...), nhưng làm theo batch để giảm số query.
      // Kiểm tra user có phải là member của phòng chat không
      if (!memberChatIds.has(convId)) continue;

      const conv = convEntity.toObject();
      const payload: ConversationItem = {
        id: conv.id,
        type: conv.type,
        createdBy: conv.createdBy,
        name: conv.name,
        avatarMediaId: conv.avatarMediaId,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt
      };

      if (conv.type === EConversationType.DIRECT) {
        // getDirectPeerId: cần biết đối phương là ai (so sánh userIdLow / userIdHigh với userId đang xem).
        conversations.push({
          ...payload,
          peerUserId: this.conversationService.getDirectPeerId({ conv: convEntity, userId })
        });
      } else {
        conversations.push(payload);
      }
    }

    return new GetConversationsResult(conversations, nextCursor);
  }
}
