import type { UseCase } from '@/modules/core/application/base.usecase';

export class BlockUserInputPort {
  blockerUserId: string;
  blockedUserId: string;
  constructor(payload: { blockerUserId: string; blockedUserId: string }) {
    this.blockerUserId = payload.blockerUserId;
    this.blockedUserId = payload.blockedUserId;
  }
}

export abstract class BlockUserPort implements UseCase<BlockUserInputPort, void> {
  abstract execute(input: BlockUserInputPort): Promise<void>;
}
