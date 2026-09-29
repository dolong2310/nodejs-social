import { UseCase } from '@/modules/core/application/base.usecase';

export class MarkReadInputPort {
  userId: string;
  conversationId: string;
  lastReadMessageId?: string;
  constructor(payload: { userId: string; conversationId: string; lastReadMessageId?: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
    this.lastReadMessageId = payload.lastReadMessageId;
  }
}

export abstract class MarkReadPort implements UseCase<MarkReadInputPort, void> {
  abstract execute(input: MarkReadInputPort): Promise<void>;
}
