import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  GetMessagesPort,
  GetMessagesInputPort,
  GetMessagesOutputPort
} from '@/modules/conversation/application/use-cases/get-messages/get-messages.port';
import { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';

/**
 * Overall workflow:
 * - Read paginated message history in a conversation.
 * - Use cursor pagination.
 * - Always enforce authorization: only conversation members can view messages.
 */
export class GetMessagesUseCase extends GetMessagesPort {
  constructor(
    private readonly chatMessageRepository: ChatMessageRepositoryPort,
    private readonly conversationService: ConversationServicePort
  ) {
    super();
  }

  async execute(input: GetMessagesInputPort): Promise<GetMessagesOutputPort> {
    const { userId, conversationId, limit, cursor } = input;
    // The viewer must be a conversation member.
    await this.conversationService.isMember({ conversationId, userId });

    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);

    // Get the message count per page, capped at 100.
    const page = Math.min(100, Math.max(1, limit));
    // Fetch one extra record: if result length > page size, older messages definitely exist (hasMore).
    const messageEntities = await this.chatMessageRepository.findMessages(conversationId, { limit: page + 1, before });
    const messages = messageEntities.map((m) => m.toObject());
    const hasMore = messages.length > page;
    // Return only the requested page size and drop the extra record used to detect hasMore.
    const items = messages.slice(0, page);
    // If hasMore and messages is not empty, encode from the last message in the page; with DESC sort, this is the oldest item in the current batch.
    // On the next call, the client sends nextCursor and the server loads the next older block with findPageBeforeCursor(..., before).
    const last = items[items.length - 1];
    const nextCursor = hasMore && items.length > 0 ? encodeCursor(last.createdAt, last.id) : null;

    return new GetMessagesOutputPort(items, nextCursor);
  }
}
