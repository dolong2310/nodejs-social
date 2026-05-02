import { UseCase } from '@/modules/core/application/base.usecase';

export class AcceptIncomingRequestCommand {
  userId: string;
  fromUserId: string;
  constructor(payload: { userId: string; fromUserId: string }) {
    this.userId = payload.userId;
    this.fromUserId = payload.fromUserId;
  }
}

export abstract class AcceptIncomingRequestInPort implements UseCase<AcceptIncomingRequestCommand, void> {
  abstract execute(command: AcceptIncomingRequestCommand): Promise<void>;
}
