import { UseCase } from '@/modules/core/application/base.usecase';

export class NotifyFriendsOfflineCommand {
  userId: string;
  constructor(payload: { userId: string }) {
    this.userId = payload.userId;
  }
}

export abstract class NotifyFriendsOfflineInPort implements UseCase<NotifyFriendsOfflineCommand, string[]> {
  abstract execute(command: NotifyFriendsOfflineCommand): Promise<string[]>;
}
