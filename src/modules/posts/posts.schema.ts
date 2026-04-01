import { IMedia } from '@/interfaces/types/media.type';
import { EPostAudience, EPostType } from '@/modules/posts/posts.enum';
import { ObjectId } from 'mongodb';

export interface IPost {
  _id: ObjectId;
  userId: ObjectId;
  type: EPostType;
  audience: EPostAudience;
  /** When missing on legacy documents, treat as true at read time (see aggregations / constructor). */
  allowStrangerComments: boolean;
  content: string;
  parentId: ObjectId | null;
  hashtags: ObjectId[];
  mentions: ObjectId[];
  media: IMedia[];
  guestViews: number;
  userViews: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PostSchema {
  public _id: ObjectId;
  public userId: ObjectId;
  public type: EPostType;
  public audience: EPostAudience;
  public allowStrangerComments: boolean;
  public content: string;
  public parentId: ObjectId | null;
  public hashtags: ObjectId[];
  public mentions: ObjectId[];
  public media: IMedia[];
  public guestViews: number;
  public userViews: number;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor({
    _id,
    userId,
    type,
    audience,
    allowStrangerComments,
    content,
    parentId,
    hashtags,
    mentions,
    media,
    guestViews,
    userViews,
    createdAt,
    updatedAt
  }: Omit<IPost, '_id'> & { _id?: ObjectId; allowStrangerComments?: boolean }) {
    const date = new Date();

    this._id = _id ?? new ObjectId();
    this.userId = userId;
    this.type = type;
    this.audience = audience;
    // Legacy docs without this field: default open comments from strangers on public posts.
    this.allowStrangerComments = allowStrangerComments ?? true;
    this.content = content;
    this.parentId = parentId;
    this.hashtags = hashtags;
    this.mentions = mentions;
    this.media = media;
    this.guestViews = guestViews ?? 0;
    this.userViews = userViews ?? 0;
    this.createdAt = createdAt ?? date;
    this.updatedAt = updatedAt ?? date;
  }
}
