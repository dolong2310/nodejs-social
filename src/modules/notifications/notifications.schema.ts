import { ObjectId } from 'mongodb';

export type NotificationType = 'friend_request' | 'friend_accepted' | 'new_message' | 'added_to_group';

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

export type NewMessagePreviewKind = 'text' | 'attachment' | 'mixed';

export interface INewMessageNotificationPayload {
  chatId: string;
  messageId: string;
  previewText?: string;
  previewKind: NewMessagePreviewKind;
}

export interface IAddedToGroupNotificationPayload {
  chatId: string;
  chatName?: string;
}

export type INotificationPayload =
  | IFriendRequestNotificationPayload
  | IFriendAcceptedNotificationPayload
  | INewMessageNotificationPayload
  | IAddedToGroupNotificationPayload;

export interface INotificationBase {
  _id: ObjectId;
  recipientId: ObjectId;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  type: NotificationType;
  actor: INotificationActor;
  payload: INotificationPayload;
}

/** Stored notification document (social DB). */
export type INotification = INotificationBase;

export class NotificationSchema implements INotification {
  public _id: ObjectId;
  public recipientId: ObjectId;
  public read: boolean;
  public readAt?: Date;
  public createdAt: Date;
  public type: NotificationType;
  public actor: INotificationActor;
  public payload: INotificationPayload;

  constructor(
    data: Omit<INotification, '_id' | 'createdAt' | 'read' | 'readAt' | 'recipientId'> & {
      _id?: ObjectId;
      recipientId: string | ObjectId;
      createdAt?: Date;
      read?: boolean;
      readAt?: Date;
    }
  ) {
    this._id = data._id ?? new ObjectId();
    this.recipientId = typeof data.recipientId === 'string' ? new ObjectId(data.recipientId) : data.recipientId;
    this.read = data.read ?? false;
    this.readAt = data.readAt;
    this.createdAt = data.createdAt ?? new Date();
    this.type = data.type;
    this.actor = data.actor;
    this.payload = data.payload;
  }
}
