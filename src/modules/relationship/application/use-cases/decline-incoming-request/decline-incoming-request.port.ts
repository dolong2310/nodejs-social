import { UseCase } from '@/modules/core/application/base.usecase';

export class DeclineIncomingRequestInputPort {
  userId: string;
  fromUserId: string;
  constructor(payload: { userId: string; fromUserId: string }) {
    this.userId = payload.userId;
    this.fromUserId = payload.fromUserId;
  }
}

export abstract class DeclineIncomingRequestPort implements UseCase<DeclineIncomingRequestInputPort, void> {
  abstract execute(input: DeclineIncomingRequestInputPort): Promise<void>;
}
