import { UseCase } from '@/modules/core/application/base.usecase';

export class NotifyFriendsOnlineCommand {
  userId: string;
  constructor(payload: { userId: string }) {
    this.userId = payload.userId;
  }
}

export abstract class NotifyFriendsOnlineInPort implements UseCase<NotifyFriendsOnlineCommand, string[]> {
  abstract execute(command: NotifyFriendsOnlineCommand): Promise<string[]>;
}
