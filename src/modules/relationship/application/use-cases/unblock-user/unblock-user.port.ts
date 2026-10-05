import type { UseCase } from '@/modules/core/application/base.usecase';

export class UnblockUserInputPort {
  blockerUserId: string;
  blockedUserId: string;
  constructor(payload: { blockerUserId: string; blockedUserId: string }) {
    this.blockerUserId = payload.blockerUserId;
    this.blockedUserId = payload.blockedUserId;
  }
}

export abstract class UnblockUserPort implements UseCase<UnblockUserInputPort, void> {
  abstract execute(input: UnblockUserInputPort): Promise<void>;
}
