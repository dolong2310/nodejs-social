import { UseCase } from '@/modules/core/application/base.usecase';

export class TypingCommand {
  userId: string;
  conversationId?: string;
  typing?: boolean;
  constructor(payload: { userId: string; conversationId?: string; typing?: boolean }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
    this.typing = payload.typing;
  }
}

export class TypingResult {
  conversationId: string;
  userId: string;
  typing: boolean;
  constructor(payload: { conversationId: string; userId: string; typing: boolean }) {
    this.conversationId = payload.conversationId;
    this.userId = payload.userId;
    this.typing = payload.typing;
  }
}

export abstract class TypingInPort implements UseCase<TypingCommand, TypingResult | null> {
  abstract execute(command: TypingCommand): Promise<TypingResult | null>;
}
