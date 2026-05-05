import { UseCase } from '@/modules/core/application/base.usecase';

export class MarkNotificationReadCommand {
  viewerId: string;
  notificationId: string;

  constructor(props: { viewerId: string; notificationId: string }) {
    this.viewerId = props.viewerId;
    this.notificationId = props.notificationId;
  }
}

export abstract class MarkNotificationReadPort implements UseCase<MarkNotificationReadCommand, void> {
  abstract execute(command: MarkNotificationReadCommand): Promise<void>;
}
