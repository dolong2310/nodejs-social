import { IPostDetailOutput, IPostDetailWithAuthorOutput } from '@/modules/post/application/ports/queries/post-query.type';
import { HashtagFullProps } from '@/modules/hashtag/domain/entities/hashtag.type';
import { EPostAudience, EPostType, PostFullProps } from '@/modules/post/domain/entities/post.type';
import { UserFullProps } from '@/modules/user/domain/entities/user.type';
import { Media } from '@/modules/core/domain/value-objects/media.value-object';
import { Prettify } from 'ts-essentials';

export class PostResponseDTO implements PostFullProps {
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
  createdAt: Date;
  updatedAt: Date;
  constructor(payload: PostFullProps) {
    this.id = payload.id;
    this.userId = payload.userId;
    this.type = payload.type;
    this.audience = payload.audience;
    this.allowStrangerComments = payload.allowStrangerComments;
    this.content = payload.content;
    this.parentId = payload.parentId;
    this.hashtags = payload.hashtags;
    this.mentions = payload.mentions;
    this.media = payload.media;
    this.guestViews = payload.guestViews ?? 0;
    this.userViews = payload.userViews ?? 0;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

export class PostDetailResponseDTO implements IPostDetailOutput {
  id: string;
  userId: string;
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: HashtagFullProps[];
  mentions: Prettify<Pick<UserFullProps, 'id' | 'name' | 'email' | 'username' | 'status'>>[];
  media: Media[];
  guestViews: number;
  userViews: number;
  createdAt: Date;
  updatedAt: Date;
  bookmarkCount: number;
  repostCount: number;
  commentCount: number;
  quoteCount: number;
  constructor(payload: IPostDetailOutput) {
    this.id = payload.id;
    this.userId = payload.userId;
    this.type = payload.type;
    this.audience = payload.audience;
    this.allowStrangerComments = payload.allowStrangerComments;
    this.content = payload.content;
    this.parentId = payload.parentId;
    this.hashtags = payload.hashtags;
    this.mentions = payload.mentions.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      username: m.username,
      status: m.status
    }));
    this.media = payload.media;
    this.guestViews = payload.guestViews ?? 0;
    this.userViews = payload.userViews ?? 0;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
    this.bookmarkCount = payload.bookmarkCount;
    this.repostCount = payload.repostCount;
    this.commentCount = payload.commentCount;
    this.quoteCount = payload.quoteCount;
  }
}

export class PostDetailWithAuthorResponseDTO implements IPostDetailWithAuthorOutput {
  id: string;
  userId: string;
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: HashtagFullProps[];
  mentions: Prettify<Pick<UserFullProps, 'id' | 'name' | 'email' | 'username' | 'status'>>[];
  media: Media[];
  guestViews: number;
  userViews: number;
  createdAt: Date;
  updatedAt: Date;
  bookmarkCount: number;
  repostCount: number;
  commentCount: number;
  quoteCount: number;
  author: Prettify<Pick<UserFullProps, 'id' | 'name' | 'email' | 'username' | 'avatar'>>;
  constructor(payload: IPostDetailWithAuthorOutput) {
    this.id = payload.id;
    this.userId = payload.userId;
    this.type = payload.type;
    this.audience = payload.audience;
    this.allowStrangerComments = payload.allowStrangerComments;
    this.content = payload.content;
    this.parentId = payload.parentId;
    this.hashtags = payload.hashtags;
    this.mentions = payload.mentions.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      username: m.username,
      status: m.status
    }));
    this.media = payload.media;
    this.guestViews = payload.guestViews ?? 0;
    this.userViews = payload.userViews ?? 0;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
    this.bookmarkCount = payload.bookmarkCount;
    this.repostCount = payload.repostCount;
    this.commentCount = payload.commentCount;
    this.quoteCount = payload.quoteCount;
    this.author = payload.author;
  }
}
