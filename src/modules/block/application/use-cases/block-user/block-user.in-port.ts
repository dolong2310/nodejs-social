import { UseCase } from '@/modules/core/application/base.usecase';

export class BlockUserCommand {
  blockerUserId: string;
  blockedUserId: string;
  constructor(payload: { blockerUserId: string; blockedUserId: string }) {
    this.blockerUserId = payload.blockerUserId;
    this.blockedUserId = payload.blockedUserId;
  }
}

export abstract class BlockUserInPort implements UseCase<BlockUserCommand, void> {
  abstract execute(command: BlockUserCommand): Promise<void>;
}
