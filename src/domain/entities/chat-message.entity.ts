/** Attachment metadata stored on chat messages (S3 key + client-safe fields). */
export interface IChatAttachment {
  key: string;
  mime: string;
  size: number;
  url?: string;
}

export interface IChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  attachments?: IChatAttachment[];
  createdAt: Date;
}

export class ChatMessageEntity {
  private _id!: string;
  private _conversationId!: string;
  private _senderId!: string;
  private _text?: string;
  private _attachments?: IChatAttachment[];
  private _createdAt!: Date;

  public get id(): string {
    return this._id;
  }
  private set id(value: string) {
    this._id = value;
  }

  public get conversationId(): string {
    return this._conversationId;
  }
  private set conversationId(value: string) {
    this._conversationId = value;
  }

  public get senderId(): string {
    return this._senderId;
  }
  private set senderId(value: string) {
    this._senderId = value;
  }

  public get text(): string | undefined {
    return this._text;
  }
  private set text(value: string | undefined) {
    this._text = value;
  }

  public get attachments(): IChatAttachment[] | undefined {
    return this._attachments;
  }
  private set attachments(value: IChatAttachment[] | undefined) {
    this._attachments = value;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }
  private set createdAt(value: Date) {
    this._createdAt = value;
  }
  private constructor(data: IChatMessage) {
    this.id = data.id;
    this.conversationId = data.conversationId;
    this.senderId = data.senderId;
    this.text = data.text;
    this.attachments = data.attachments;
    this.createdAt = data.createdAt ?? new Date();
  }

  public static create(data: IChatMessage): ChatMessageEntity {
    return new ChatMessageEntity(data);
  }
}
