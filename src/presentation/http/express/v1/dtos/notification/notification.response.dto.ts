import {
  EnumNotificationType,
  INotificationActor,
  INotificationPayload,
  NotificationFullProps
} from '@/modules/notification/domain/entities/notification.type';

export class NotificationResponseDTO implements NotificationFullProps {
  id: string;
  recipientId: string;
  read: boolean;
  readAt?: Date;
  type: EnumNotificationType;
  actor: INotificationActor;
  payload: INotificationPayload;
  createdAt: Date;
  updatedAt: Date;
  summary: string;

  constructor(notification: NotificationFullProps & { summary: string }) {
    this.id = notification.id;
    this.recipientId = notification.recipientId;
    this.read = notification.read;
    this.readAt = notification.readAt;
    this.type = notification.type;
    this.actor = notification.actor;
    this.payload = notification.payload;
    this.createdAt = notification.createdAt;
    this.updatedAt = notification.updatedAt;
    this.summary = notification.summary;
  }
}
