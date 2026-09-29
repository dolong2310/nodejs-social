import { UseCase } from '@/modules/core/application/base.usecase';

export class MarkNotificationsReadInputPort {
  viewerId: string;
  ids?: string[];

  constructor(props: { viewerId: string; ids?: string[] }) {
    this.viewerId = props.viewerId;
    this.ids = props.ids;
  }
}

export abstract class MarkNotificationsReadPort implements UseCase<MarkNotificationsReadInputPort, void> {
  abstract execute(input: MarkNotificationsReadInputPort): Promise<void>;
}
