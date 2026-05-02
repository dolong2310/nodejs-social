import { UseCase } from '@/modules/core/application/base.usecase';

export class GetConversationPresenceCommand {
  conversationId: string;
  constructor(payload: { conversationId: string }) {
    this.conversationId = payload.conversationId;
  }
}

export abstract class GetConversationPresenceInPort implements UseCase<GetConversationPresenceCommand, string[]> {
  abstract execute(command: GetConversationPresenceCommand): Promise<string[]>;
}
