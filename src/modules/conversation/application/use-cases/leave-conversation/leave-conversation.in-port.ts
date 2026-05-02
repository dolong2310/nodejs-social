import { UseCase } from '@/modules/core/application/base.usecase';

export class LeaveConversationCommand {
  userId: string;
  conversationId: string;
  constructor(payload: { userId: string; conversationId: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
  }
}

export abstract class LeaveConversationInPort implements UseCase<LeaveConversationCommand, void> {
  abstract execute(command: LeaveConversationCommand): Promise<void>;
}
