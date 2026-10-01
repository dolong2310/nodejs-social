import type { NotificationEntity } from '@/modules/notification/domain/entities/notification.entity';
import {
  EnumNewMessagePreviewKind,
  EnumNotificationType,
  type INewMessageNotificationPayload
} from '@/modules/notification/domain/entities/notification.types';

export function notificationSummary(entity: NotificationEntity): string {
  const notification = entity.toObject();
  switch (notification.type) {
    case EnumNotificationType.FRIEND_REQUEST:
      return `${notification.actor.displayName} sent you a friend request`;
    case EnumNotificationType.FRIEND_ACCEPTED:
      return `${notification.actor.displayName} accepted your friend request`;
    case EnumNotificationType.NEW_MESSAGE: {
      const p = notification.payload as INewMessageNotificationPayload;
      if (p.previewKind === EnumNewMessagePreviewKind.ATTACHMENT) {
        return 'Sent a photo';
      }
      if (p.previewText) {
        return p.previewText.length > 80 ? `${p.previewText.slice(0, 80)}…` : p.previewText;
      }
      return 'New message';
    }
    case EnumNotificationType.ADDED_TO_GROUP:
      return `${notification.actor.displayName} added you to a group chat`;
    default:
      return 'Notification';
  }
}
