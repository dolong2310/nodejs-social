import {
  IAddedToGroupNotificationPayload,
  IFriendAcceptedNotificationPayload,
  IFriendRequestNotificationPayload,
  INewMessageNotificationPayload,
  INotification,
  NotificationType
} from '@/models/notification.schema';

export interface NotificationActorDTO {
  userId: string;
  displayName: string;
  avatar?: string;
}

export type NotificationPayloadDTO =
  | IFriendRequestNotificationPayload
  | IFriendAcceptedNotificationPayload
  | INewMessageNotificationPayload
  | IAddedToGroupNotificationPayload;

export interface NotificationListItemDTO {
  _id: string;
  read: boolean;
  createdAt: string;
  type: NotificationType;
  summary: string;
  actor: NotificationActorDTO;
  payload: NotificationPayloadDTO;
}

const ATTACHMENT_ONLY_SUMMARY = 'Đã gửi một ảnh';

export function notificationSummary(n: INotification): string {
  switch (n.type) {
    case 'friend_request':
      return `${n.actor.displayName} đã gửi lời mời kết bạn`;
    case 'friend_accepted':
      return `${n.actor.displayName} đã chấp nhận lời mời kết bạn`;
    case 'new_message': {
      const p = n.payload as INewMessageNotificationPayload;
      if (p.previewKind === 'attachment') {
        return ATTACHMENT_ONLY_SUMMARY;
      }
      if (p.previewText) {
        return p.previewText.length > 80 ? `${p.previewText.slice(0, 80)}…` : p.previewText;
      }
      return 'Tin nhắn mới';
    }
    case 'added_to_group':
      return `${n.actor.displayName} đã thêm bạn vào nhóm chat`;
    default:
      return 'Thông báo';
  }
}

export function toNotificationListItem(doc: INotification): NotificationListItemDTO {
  return {
    _id: doc._id.toHexString(),
    read: doc.read,
    createdAt: doc.createdAt.toISOString(),
    type: doc.type,
    summary: notificationSummary(doc),
    actor: doc.actor,
    payload: doc.payload as NotificationPayloadDTO
  };
}

export interface NotificationsPageDTO {
  notifications: NotificationListItemDTO[];
  nextCursor: string | null;
}
