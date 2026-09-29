import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  ConversationItem,
  GetConversationsPort,
  GetConversationsInputPort,
  GetConversationsOutputPort
} from '@/modules/conversation/application/use-cases/get-conversations/get-conversations.port';
import { EnumConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ConversationMemberQueryRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.query.repository';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';

export class GetConversationsUseCase extends GetConversationsPort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationMemberQueryRepository: ConversationMemberQueryRepositoryPort,
    private readonly conversationService: ConversationServicePort
  ) {
    super();
  }

  async execute(input: GetConversationsInputPort): Promise<GetConversationsOutputPort> {
    const { userId, limit, cursor } = input;
    const decoded = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);

    // Clamp page size to a safe range (1-100) to avoid overly large limits.
    const page = Math.min(100, Math.max(1, limit));
    // Load the user's chat rooms (conversations).
    const results = await this.conversationMemberQueryRepository.listConversationsForUser({
      userId,
      limit: page + 1,
      cursor: decoded
    });
    const hasMore = results.length > page;
    const slice = results.slice(0, page);
    const last = slice[slice.length - 1];
    const nextCursor =
      // If more data exists, encode updatedAt and conversationId of the last item in the slice as the next-page cursor.
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
      // Check whether the chat room exists.
      const convEntity = convById.get(convId);
      if (!convEntity) continue;
      // Equivalent to isMember(...), but batched to reduce query count.
      // Check whether the user is a member of the chat room.
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

      if (conv.type === EnumConversationType.DIRECT) {
        // getDirectPeerId needs to know the peer user by comparing userIdLow/userIdHigh with the viewing userId.
        conversations.push({
          ...payload,
          peerUserId: this.conversationService.getDirectPeerId({ conv: convEntity, userId })
        });
      } else {
        conversations.push(payload);
      }
    }

    return new GetConversationsOutputPort(conversations, nextCursor);
  }
}
