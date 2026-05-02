import { UseCase } from '@/modules/core/application/base.usecase';

export class DeclineIncomingRequestCommand {
  userId: string;
  fromUserId: string;
  constructor(payload: { userId: string; fromUserId: string }) {
    this.userId = payload.userId;
    this.fromUserId = payload.fromUserId;
  }
}

export abstract class DeclineIncomingRequestInPort implements UseCase<DeclineIncomingRequestCommand, void> {
  abstract execute(command: DeclineIncomingRequestCommand): Promise<void>;
}
