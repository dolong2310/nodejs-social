import { UseCase } from '@/modules/core/application/base.usecase';

export class JoinConversationCommand {
  userId: string;
  conversationId?: string;
  constructor(payload: { userId: string; conversationId?: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
  }
}

export class JoinConversationResult {
  conversationId: string;
  constructor(payload: { conversationId: string }) {
    this.conversationId = payload.conversationId;
  }
}

export abstract class JoinConversationPort implements UseCase<JoinConversationCommand, JoinConversationResult | null> {
  abstract execute(command: JoinConversationCommand): Promise<JoinConversationResult | null>;
}
