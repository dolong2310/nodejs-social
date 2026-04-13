import { EPostAudience, EPostType } from '@/domain/enums/posts.enum';
import { Media } from '@/domain/value-objects/media.value-object';

export interface IPost {
  id: string;
  userId: string;
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: string[];
  mentions: string[];
  media: Media[];
  guestViews: number;
  userViews: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PostEntity {
  private _id!: string;
  private _userId!: string;
  private _type!: EPostType;
  private _audience!: EPostAudience;
  private _allowStrangerComments!: boolean;
  private _content!: string;
  private _parentId!: string | null;
  private _hashtags!: string[];
  private _mentions!: string[];
  private _media!: Media[];
  private _guestViews!: number;
  private _userViews!: number;
  private _createdAt?: Date;
  private _updatedAt?: Date;

  public get id(): string {
    return this._id;
  }
  private set id(value: string) {
    this._id = value;
  }

  public get userId(): string {
    return this._userId;
  }
  private set userId(value: string) {
    this._userId = value;
  }

  public get type(): EPostType {
    return this._type;
  }
  private set type(value: EPostType) {
    this._type = value;
  }

  public get audience(): EPostAudience {
    return this._audience;
  }
  private set audience(value: EPostAudience) {
    this._audience = value;
  }

  public get allowStrangerComments(): boolean {
    return this._allowStrangerComments;
  }
  private set allowStrangerComments(value: boolean) {
    this._allowStrangerComments = value;
  }

  public get content(): string {
    return this._content;
  }
  private set content(value: string) {
    this._content = value;
  }

  public get parentId(): string | null {
    return this._parentId;
  }
  private set parentId(value: string | null) {
    this._parentId = value;
  }

  public get hashtags(): string[] {
    return this._hashtags;
  }
  private set hashtags(value: string[]) {
    this._hashtags = value;
  }

  public get mentions(): string[] {
    return this._mentions;
  }
  private set mentions(value: string[]) {
    this._mentions = value;
  }

  public get media(): Media[] {
    return this._media;
  }
  private set media(value: Media[]) {
    this._media = value;
  }

  public get guestViews(): number {
    return this._guestViews;
  }
  private set guestViews(value: number) {
    this._guestViews = value;
  }

  public get userViews(): number {
    return this._userViews;
  }
  private set userViews(value: number) {
    this._userViews = value;
  }

  public get createdAt(): Date | undefined {
    return this._createdAt;
  }
  private set createdAt(value: Date | undefined) {
    this._createdAt = value;
  }

  public get updatedAt(): Date | undefined {
    return this._updatedAt;
  }
  private set updatedAt(value: Date | undefined) {
    this._updatedAt = value;
  }
  private constructor(data: IPost) {
    const date = new Date();
    this.id = data.id;
    this.userId = data.userId;
    this.type = data.type;
    this.audience = data.audience;
    this.allowStrangerComments = data.allowStrangerComments ?? true;
    this.content = data.content;
    this.parentId = data.parentId;
    this.hashtags = data.hashtags;
    this.mentions = data.mentions;
    this.media = data.media.map((m) => Media.create({ url: m.url, type: m.type }));
    this.guestViews = data.guestViews ?? 0;
    this.userViews = data.userViews ?? 0;
    this.createdAt = data.createdAt ?? date;
    this.updatedAt = data.updatedAt ?? date;
  }

  public static create(data: IPost): PostEntity {
    return new PostEntity(data);
  }
}
