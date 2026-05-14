import { NotificationEntity } from '@/modules/notification/domain/entities/notification.entity';
import {
  EnumNewMessagePreviewKind,
  EnumNotificationType,
  INewMessageNotificationPayload
} from '@/modules/notification/domain/entities/notification.type';

export function notificationSummary(entity: NotificationEntity): string {
  const notification = entity.toObject();
  switch (notification.type) {
    case EnumNotificationType.FRIEND_REQUEST:
      return `${notification.actor.displayName} đã gửi lời mời kết bạn`;
    case EnumNotificationType.FRIEND_ACCEPTED:
      return `${notification.actor.displayName} đã chấp nhận lời mời kết bạn`;
    case EnumNotificationType.NEW_MESSAGE: {
      const p = notification.payload as INewMessageNotificationPayload;
      if (p.previewKind === EnumNewMessagePreviewKind.ATTACHMENT) {
        return 'Đã gửi một ảnh';
      }
      if (p.previewText) {
        return p.previewText.length > 80 ? `${p.previewText.slice(0, 80)}…` : p.previewText;
      }
      return 'Tin nhắn mới';
    }
    case EnumNotificationType.ADDED_TO_GROUP:
      return `${notification.actor.displayName} đã thêm bạn vào nhóm chat`;
    default:
      return 'Thông báo';
  }
}
