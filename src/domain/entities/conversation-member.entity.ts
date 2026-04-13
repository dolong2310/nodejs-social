import { EConversationMemberRole } from '@/domain/enums/conversation-member.enum';

export interface IConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: EConversationMemberRole;
  joinedAt: Date;
  lastReadMessageId?: string | null;
  lastReadAt?: Date | null;
}

export class ConversationMemberEntity {
  private _id!: string;
  private _conversationId!: string;
  private _userId!: string;
  private _role!: EConversationMemberRole;
  private _joinedAt!: Date;
  private _lastReadMessageId?: string | null;
  private _lastReadAt?: Date | null;

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

  public get userId(): string {
    return this._userId;
  }
  private set userId(value: string) {
    this._userId = value;
  }

  public get role(): EConversationMemberRole {
    return this._role;
  }
  private set role(value: EConversationMemberRole) {
    this._role = value;
  }

  public get joinedAt(): Date {
    return this._joinedAt;
  }
  private set joinedAt(value: Date) {
    this._joinedAt = value;
  }

  public get lastReadMessageId(): string | null | undefined {
    return this._lastReadMessageId;
  }
  private set lastReadMessageId(value: string | null | undefined) {
    this._lastReadMessageId = value;
  }

  public get lastReadAt(): Date | null | undefined {
    return this._lastReadAt;
  }
  private set lastReadAt(value: Date | null | undefined) {
    this._lastReadAt = value;
  }
  private constructor(data: IConversationMember) {
    this.id = data.id;
    this.conversationId = data.conversationId;
    this.userId = data.userId;
    this.role = data.role;
    this.joinedAt = data.joinedAt ?? new Date();
    this.lastReadMessageId = data.lastReadMessageId;
    this.lastReadAt = data.lastReadAt;
  }

  public static create(data: IConversationMember): ConversationMemberEntity {
    return new ConversationMemberEntity(data);
  }
}
