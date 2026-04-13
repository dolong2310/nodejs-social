import { INotificationPayload, NotificationType } from '@/domain/entities/notification.entity';

import { ICursorPaginationResult } from '@/application/common/interfaces/cursor-pagination-result.interface';

interface NotificationActor {
  userId: string;
  displayName: string;
  avatar?: string;
}

export class NotificationListItemDTO {
  id: string;
  read: boolean;
  createdAt: string;
  type: NotificationType;
  summary: string;
  actor: NotificationActor;
  payload: INotificationPayload;
  constructor(payload: {
    id: string;
    read: boolean;
    createdAt: string;
    type: NotificationType;
    summary: string;
    actor: NotificationActor;
    payload: INotificationPayload;
  }) {
    this.id = payload.id;
    this.read = payload.read;
    this.createdAt = payload.createdAt;
    this.type = payload.type;
    this.summary = payload.summary;
    this.actor = payload.actor;
    this.payload = payload.payload;
  }
}

export class ListForViewerResultDTO implements ICursorPaginationResult<NotificationListItemDTO> {
  items: NotificationListItemDTO[];
  nextCursor: string | null;
  constructor(items: NotificationListItemDTO[], nextCursor: string | null) {
    this.items = items;
    this.nextCursor = nextCursor;
  }
}
