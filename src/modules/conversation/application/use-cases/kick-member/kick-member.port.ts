import { UseCase } from '@/modules/core/application/base.usecase';

export class KickMemberInputPort {
  userId: string;
  conversationId: string;
  targetUserId: string;
  constructor(payload: { userId: string; conversationId: string; targetUserId: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
    this.targetUserId = payload.targetUserId;
  }
}

export abstract class KickMemberPort implements UseCase<KickMemberInputPort, void> {
  abstract execute(input: KickMemberInputPort): Promise<void>;
}
