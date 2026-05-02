import { UseCase } from '@/modules/core/application/base.usecase';
import { NotificationFullProps } from '@/modules/notification/domain/entities/notification.type';

export class ListNotificationsQuery {
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

export class ListNotificationsResult {
  items: NotificationSummary[];
  nextCursor: string | null;

  constructor(props: ListNotificationsResult) {
    this.items = props.items;
    this.nextCursor = props.nextCursor;
  }
}

export abstract class ListNotificationsInPort implements UseCase<ListNotificationsQuery, ListNotificationsResult> {
  abstract execute(query: ListNotificationsQuery): Promise<ListNotificationsResult>;
}
