import type { UseCase } from '@/modules/core/application/base.usecase';

export class NotifyFriendsOnlineInputPort {
  userId: string;
  constructor(payload: { userId: string }) {
    this.userId = payload.userId;
  }
}

export abstract class NotifyFriendsOnlinePort implements UseCase<NotifyFriendsOnlineInputPort, string[]> {
  abstract execute(input: NotifyFriendsOnlineInputPort): Promise<string[]>;
}
