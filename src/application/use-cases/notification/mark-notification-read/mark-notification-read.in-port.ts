import { UseCase } from '@/application/use-cases/base/base.usecase';

export class MarkNotificationReadCommand {
  viewerId: string;
  notificationId: string;

  constructor(props: { viewerId: string; notificationId: string }) {
    this.viewerId = props.viewerId;
    this.notificationId = props.notificationId;
  }
}

export abstract class MarkNotificationReadInPort implements UseCase<MarkNotificationReadCommand, void> {
  abstract execute(command: MarkNotificationReadCommand): Promise<void>;
}
