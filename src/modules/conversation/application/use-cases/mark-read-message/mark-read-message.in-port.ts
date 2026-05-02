import { UseCase } from '@/modules/core/application/base.usecase';

export class MarkReadCommand {
  userId: string;
  conversationId: string;
  lastReadMessageId?: string;
  constructor(payload: { userId: string; conversationId: string; lastReadMessageId?: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
    this.lastReadMessageId = payload.lastReadMessageId;
  }
}

export abstract class MarkReadInPort implements UseCase<MarkReadCommand, void> {
  abstract execute(command: MarkReadCommand): Promise<void>;
}
