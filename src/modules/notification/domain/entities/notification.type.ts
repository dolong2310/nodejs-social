import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { Prettify } from 'ts-essentials';

export enum EnumNotificationType {
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_ACCEPTED = 'FRIEND_ACCEPTED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  ADDED_TO_GROUP = 'ADDED_TO_GROUP'
}

export enum EnumNewMessagePreviewKind {
  TEXT = 'TEXT',
  ATTACHMENT = 'ATTACHMENT',
  MIXED = 'MIXED'
}

export interface INotificationActor {
  userId: string;
  displayName: string;
  avatar?: string;
}

export interface IFriendRequestNotificationPayload {
  fromUserId: string;
}

export interface IFriendAcceptedNotificationPayload {
  friendUserId: string;
}

export interface INewMessageNotificationPayload {
  conversationId: string;
  messageId: string;
  previewText?: string;
  previewKind: EnumNewMessagePreviewKind;
}

export interface IAddedToGroupNotificationPayload {
  conversationId: string;
  chatName?: string;
}

export type INotificationPayload =
  | IFriendRequestNotificationPayload
  | IFriendAcceptedNotificationPayload
  | INewMessageNotificationPayload
  | IAddedToGroupNotificationPayload;

export interface NotificationProps {
  recipientId: string;
  read: boolean;
  readAt?: Date;
  type: EnumNotificationType;
  actor: INotificationActor;
  payload: INotificationPayload;
}

export interface NotificationFullProps extends Prettify<
  NotificationProps & Omit<BaseEntityProps, 'id'> & { id: string }
> {}

export interface CreateNotificationProps extends NotificationProps {}
