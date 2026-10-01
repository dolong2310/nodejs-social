import type { UseCase } from '@/modules/core/application/base.usecase';

export class AcceptIncomingRequestInputPort {
  userId: string;
  fromUserId: string;
  constructor(payload: { userId: string; fromUserId: string }) {
    this.userId = payload.userId;
    this.fromUserId = payload.fromUserId;
  }
}

export abstract class AcceptIncomingRequestPort implements UseCase<AcceptIncomingRequestInputPort, void> {
  abstract execute(input: AcceptIncomingRequestInputPort): Promise<void>;
}
