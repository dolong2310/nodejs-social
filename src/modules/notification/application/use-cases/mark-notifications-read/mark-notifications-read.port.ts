import { UseCase } from '@/modules/core/application/base.usecase';

export class MarkNotificationsReadCommand {
  viewerId: string;
  ids?: string[];

  constructor(props: { viewerId: string; ids?: string[] }) {
    this.viewerId = props.viewerId;
    this.ids = props.ids;
  }
}

export abstract class MarkNotificationsReadPort implements UseCase<MarkNotificationsReadCommand, void> {
  abstract execute(command: MarkNotificationsReadCommand): Promise<void>;
}
