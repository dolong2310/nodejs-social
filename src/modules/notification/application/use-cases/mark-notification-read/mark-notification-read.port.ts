import type { UseCase } from '@/modules/core/application/base.usecase';

export class MarkNotificationReadInputPort {
  viewerId: string;
  notificationId: string;

  constructor(props: { viewerId: string; notificationId: string }) {
    this.viewerId = props.viewerId;
    this.notificationId = props.notificationId;
  }
}

export abstract class MarkNotificationReadPort implements UseCase<MarkNotificationReadInputPort, void> {
  abstract execute(input: MarkNotificationReadInputPort): Promise<void>;
}
