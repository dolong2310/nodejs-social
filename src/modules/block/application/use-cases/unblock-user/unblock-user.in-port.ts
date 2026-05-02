import { UseCase } from '@/modules/core/application/base.usecase';

export class UnblockUserCommand {
  blockerUserId: string;
  blockedUserId: string;
  constructor(payload: { blockerUserId: string; blockedUserId: string }) {
    this.blockerUserId = payload.blockerUserId;
    this.blockedUserId = payload.blockedUserId;
  }
}

export abstract class UnblockUserInPort implements UseCase<UnblockUserCommand, void> {
  abstract execute(command: UnblockUserCommand): Promise<void>;
}
