import type { UseCase } from '@/modules/core/application/base.usecase';

export class UnfriendInputPort {
  userId: string;
  otherUserId: string;
  constructor(payload: { userId: string; otherUserId: string }) {
    this.userId = payload.userId;
    this.otherUserId = payload.otherUserId;
  }
}

export abstract class UnfriendPort implements UseCase<UnfriendInputPort, void> {
  abstract execute(input: UnfriendInputPort): Promise<void>;
}
