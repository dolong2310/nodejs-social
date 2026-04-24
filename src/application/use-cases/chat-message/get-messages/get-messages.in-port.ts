import { UseCase } from '@/application/use-cases/base/base.usecase';
import { ChatMessageFullProps } from '@/domain/entities/chat-message/chat-message.type';

export class GetMessagesQuery {
  userId: string;
  conversationId: string;
  limit: number;
  cursor?: string;
  constructor(payload: { userId: string; conversationId: string; limit: string; cursor?: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class GetMessagesResult {
  items: ChatMessageFullProps[];
  nextCursor: string | null;
  constructor(items: ChatMessageFullProps[], nextCursor: string | null) {
    this.items = items;
    this.nextCursor = nextCursor;
  }
}

export abstract class GetMessagesInPort implements UseCase<GetMessagesQuery, GetMessagesResult> {
  abstract execute(query: GetMessagesQuery): Promise<GetMessagesResult>;
}
