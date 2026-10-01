import type { UseCase } from '@/modules/core/application/base.usecase';

export class GetConversationPresenceInputPort {
  conversationId: string;
  constructor(payload: { conversationId: string }) {
    this.conversationId = payload.conversationId;
  }
}

export abstract class GetConversationPresencePort implements UseCase<GetConversationPresenceInputPort, string[]> {
  abstract execute(input: GetConversationPresenceInputPort): Promise<string[]>;
}
