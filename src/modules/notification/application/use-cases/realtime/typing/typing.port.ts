import type { UseCase } from '@/modules/core/application/base.usecase';

export class TypingInputPort {
  userId: string;
  conversationId?: string;
  typing?: boolean;
  constructor(payload: { userId: string; conversationId?: string; typing?: boolean }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
    this.typing = payload.typing;
  }
}

export class TypingOutputPort {
  conversationId: string;
  userId: string;
  typing: boolean;
  constructor(payload: { conversationId: string; userId: string; typing: boolean }) {
    this.conversationId = payload.conversationId;
    this.userId = payload.userId;
    this.typing = payload.typing;
  }
}

export abstract class TypingPort implements UseCase<TypingInputPort, TypingOutputPort | null> {
  abstract execute(input: TypingInputPort): Promise<TypingOutputPort | null>;
}
