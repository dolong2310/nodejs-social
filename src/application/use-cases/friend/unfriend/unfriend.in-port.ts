import { UseCase } from '@/application/use-cases/base/base.usecase';

export class UnfriendCommand {
  userId: string;
  otherUserId: string;
  constructor(payload: { userId: string; otherUserId: string }) {
    this.userId = payload.userId;
    this.otherUserId = payload.otherUserId;
  }
}

export abstract class UnfriendInPort implements UseCase<UnfriendCommand, void> {
  abstract execute(command: UnfriendCommand): Promise<void>;
}
