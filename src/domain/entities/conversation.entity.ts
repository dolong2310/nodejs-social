import { EConversationType } from '@/domain/enums/conversation.enum';

export interface IConversation {
  id: string;
  type: EConversationType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  name?: string;
  avatarMediaId?: string | null;
  // Direct only — canonical low/high pair (same ordering as friendships).
  userIdLow?: string;
  userIdHigh?: string;
}

export class ConversationEntity {
  private _id!: string;
  private _type!: EConversationType;
  private _createdBy!: string;
  private _createdAt!: Date;
  private _updatedAt!: Date;
  private _name?: string;
  private _avatarMediaId?: string | null;
  private _userIdLow?: string;
  private _userIdHigh?: string;

  public get id(): string {
    return this._id;
  }
  private set id(value: string) {
    this._id = value;
  }

  public get type(): EConversationType {
    return this._type;
  }
  private set type(value: EConversationType) {
    this._type = value;
  }

  public get createdBy(): string {
    return this._createdBy;
  }
  private set createdBy(value: string) {
    this._createdBy = value;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }
  private set createdAt(value: Date) {
    this._createdAt = value;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }
  private set updatedAt(value: Date) {
    this._updatedAt = value;
  }

  public get name(): string | undefined {
    return this._name;
  }
  private set name(value: string | undefined) {
    this._name = value;
  }

  public get avatarMediaId(): string | null | undefined {
    return this._avatarMediaId;
  }
  private set avatarMediaId(value: string | null | undefined) {
    this._avatarMediaId = value;
  }

  public get userIdLow(): string | undefined {
    return this._userIdLow;
  }
  private set userIdLow(value: string | undefined) {
    this._userIdLow = value;
  }

  public get userIdHigh(): string | undefined {
    return this._userIdHigh;
  }
  private set userIdHigh(value: string | undefined) {
    this._userIdHigh = value;
  }
  private constructor(data: IConversation) {
    const date = new Date();
    this.id = data.id;
    this.type = data.type;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt ?? date;
    this.updatedAt = data.updatedAt ?? date;
    this.name = data.name;
    this.avatarMediaId = data.avatarMediaId;
    this.userIdLow = data.userIdLow;
    this.userIdHigh = data.userIdHigh;
  }

  public static create(data: IConversation): ConversationEntity {
    return new ConversationEntity(data);
  }
}
