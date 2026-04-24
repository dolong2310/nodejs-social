import { UseCase } from '@/application/use-cases/base/base.usecase';

export class RevokeOutgoingRequestCommand {
  userId: string;
  toUserId: string;
  constructor(payload: { userId: string; toUserId: string }) {
    this.userId = payload.userId;
    this.toUserId = payload.toUserId;
  }
}

export abstract class RevokeOutgoingRequestInPort implements UseCase<RevokeOutgoingRequestCommand, void> {
  abstract execute(command: RevokeOutgoingRequestCommand): Promise<void>;
}
