import { UseCase } from '@/application/use-cases/base/base.usecase';

export class MarkNotificationsReadCommand {
  viewerId: string;
  ids?: string[];

  constructor(props: { viewerId: string; ids?: string[] }) {
    this.viewerId = props.viewerId;
    this.ids = props.ids;
  }
}

export abstract class MarkNotificationsReadInPort implements UseCase<MarkNotificationsReadCommand, void> {
  abstract execute(command: MarkNotificationsReadCommand): Promise<void>;
}
