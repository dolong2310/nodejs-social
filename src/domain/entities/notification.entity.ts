export type NotificationType = 'friend_request' | 'friend_accepted' | 'new_message' | 'added_to_group';
export type NewMessagePreviewKind = 'text' | 'attachment' | 'mixed';

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
  previewKind: NewMessagePreviewKind;
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

export interface INotification {
  id: string;
  recipientId: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  type: NotificationType;
  actor: INotificationActor;
  payload: INotificationPayload;
}

export class NotificationEntity {
  private _id!: string;
  private _recipientId!: string;
  private _read!: boolean;
  private _readAt?: Date;
  private _createdAt!: Date;
  private _type!: NotificationType;
  private _actor!: INotificationActor;
  private _payload!: INotificationPayload;

  public get id(): string {
    return this._id;
  }
  private set id(value: string) {
    this._id = value;
  }

  public get recipientId(): string {
    return this._recipientId;
  }
  private set recipientId(value: string) {
    this._recipientId = value;
  }

  public get read(): boolean {
    return this._read;
  }
  private set read(value: boolean) {
    this._read = value;
  }

  public get readAt(): Date | undefined {
    return this._readAt;
  }
  private set readAt(value: Date | undefined) {
    this._readAt = value;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }
  private set createdAt(value: Date) {
    this._createdAt = value;
  }

  public get type(): NotificationType {
    return this._type;
  }
  private set type(value: NotificationType) {
    this._type = value;
  }

  public get actor(): INotificationActor {
    return this._actor;
  }
  private set actor(value: INotificationActor) {
    this._actor = value;
  }

  public get payload(): INotificationPayload {
    return this._payload;
  }
  private set payload(value: INotificationPayload) {
    this._payload = value;
  }
  private constructor(data: INotification) {
    this.id = data.id;
    this.recipientId = data.recipientId;
    this.read = data.read ?? false;
    this.readAt = data.readAt;
    this.createdAt = data.createdAt ?? new Date();
    this.type = data.type;
    this.actor = data.actor;
    this.payload = data.payload;
  }

  public static create(data: INotification): NotificationEntity {
    return new NotificationEntity(data);
  }
}
