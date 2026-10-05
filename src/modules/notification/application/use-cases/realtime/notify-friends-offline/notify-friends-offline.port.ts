import type { UseCase } from '@/modules/core/application/base.usecase';

export class NotifyFriendsOfflineInputPort {
  userId: string;
  constructor(payload: { userId: string }) {
    this.userId = payload.userId;
  }
}

export abstract class NotifyFriendsOfflinePort implements UseCase<NotifyFriendsOfflineInputPort, string[]> {
  abstract execute(input: NotifyFriendsOfflineInputPort): Promise<string[]>;
}
