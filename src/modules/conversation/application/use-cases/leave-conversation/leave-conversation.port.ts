import { UseCase } from '@/modules/core/application/base.usecase';

export class LeaveConversationInputPort {
  userId: string;
  conversationId: string;
  constructor(payload: { userId: string; conversationId: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
  }
}

export abstract class LeaveConversationPort implements UseCase<LeaveConversationInputPort, void> {
  abstract execute(input: LeaveConversationInputPort): Promise<void>;
}
