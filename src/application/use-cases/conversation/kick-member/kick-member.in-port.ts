import { UseCase } from '@/application/use-cases/base/base.usecase';

export class KickMemberCommand {
  userId: string;
  conversationId: string;
  targetUserId: string;
  constructor(payload: { userId: string; conversationId: string; targetUserId: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
    this.targetUserId = payload.targetUserId;
  }
}

export abstract class KickMemberInPort implements UseCase<KickMemberCommand, void> {
  abstract execute(command: KickMemberCommand): Promise<void>;
}
