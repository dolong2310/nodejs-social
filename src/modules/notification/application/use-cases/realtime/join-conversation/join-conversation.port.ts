import { UseCase } from '@/modules/core/application/base.usecase';

export class JoinConversationInputPort {
  userId: string;
  conversationId?: string;
  constructor(payload: { userId: string; conversationId?: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
  }
}

export class JoinConversationOutputPort {
  conversationId: string;
  constructor(payload: { conversationId: string }) {
    this.conversationId = payload.conversationId;
  }
}

export abstract class JoinConversationPort implements UseCase<
  JoinConversationInputPort,
  JoinConversationOutputPort | null
> {
  abstract execute(input: JoinConversationInputPort): Promise<JoinConversationOutputPort | null>;
}
