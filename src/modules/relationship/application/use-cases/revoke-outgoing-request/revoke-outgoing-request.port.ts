import { UseCase } from '@/modules/core/application/base.usecase';

export class RevokeOutgoingRequestInputPort {
  userId: string;
  toUserId: string;
  constructor(payload: { userId: string; toUserId: string }) {
    this.userId = payload.userId;
    this.toUserId = payload.toUserId;
  }
}

export abstract class RevokeOutgoingRequestPort implements UseCase<RevokeOutgoingRequestInputPort, void> {
  abstract execute(input: RevokeOutgoingRequestInputPort): Promise<void>;
}
