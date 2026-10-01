import { UseCase } from '@/modules/core/application/base.usecase';
import { NotificationFullProps } from '@/modules/notification/domain/entities/notification.types';

export class ListNotificationsInputPort {
  viewerId: string;
  limit: number;
  cursor?: string;
  unreadOnly?: boolean;

  constructor(props: { viewerId: string; limit: number; cursor?: string; unreadOnly?: boolean }) {
    this.viewerId = props.viewerId;
    this.limit = props.limit;
    this.cursor = props.cursor;
    this.unreadOnly = props.unreadOnly;
  }
}

export interface NotificationSummary extends NotificationFullProps {
  summary: string;
}

export class ListNotificationsOutputPort {
  items: NotificationSummary[];
  nextCursor: string | null;

  constructor(props: ListNotificationsOutputPort) {
    this.items = props.items;
    this.nextCursor = props.nextCursor;
  }
}

export abstract class ListNotificationsPort implements UseCase<
  ListNotificationsInputPort,
  ListNotificationsOutputPort
> {
  abstract execute(input: ListNotificationsInputPort): Promise<ListNotificationsOutputPort>;
}
