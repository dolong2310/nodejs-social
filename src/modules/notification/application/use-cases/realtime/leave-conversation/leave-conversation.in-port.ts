import { UseCase } from '@/modules/core/application/base.usecase';

export class LeaveConversationCommand {
  userId: string;
  conversationId?: string;
  constructor(payload: { userId: string; conversationId?: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
  }
}

export class LeaveConversationResult {
  conversationId: string;
  constructor(payload: { conversationId: string }) {
    this.conversationId = payload.conversationId;
  }
}

export abstract class LeaveConversationInPort implements UseCase<
  LeaveConversationCommand,
  LeaveConversationResult | null
> {
  abstract execute(command: LeaveConversationCommand): Promise<LeaveConversationResult | null>;
}
