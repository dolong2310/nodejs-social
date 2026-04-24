import { UseCase } from '@/application/use-cases/base/base.usecase';

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

export abstract class JoinConversationInPort implements UseCase<
  JoinConversationCommand,
  JoinConversationResult | null
> {
  abstract execute(command: JoinConversationCommand): Promise<JoinConversationResult | null>;
}
