import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { Media } from '@/modules/core/domain/value-objects/media.value-object';
import { MarkOptional, Prettify } from 'ts-essentials';

export interface PostProps {
  userId: string;
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: string[];
  mentions: string[];
  media: Media[];
  guestViews?: number;
  userViews?: number;
}

export interface PostFullProps extends Prettify<PostProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreatePostProps extends MarkOptional<PostProps, 'guestViews' | 'userViews'> {}

export enum EPostType {
  POST = 'post',
  REPOST = 'repost',
  COMMENT = 'comment',
  QUOTE = 'quote'
}

export enum EPostAudience {
  PUBLIC = 'public',
  FRIENDS_ONLY = 'friends-only',
  ONLY_ME = 'only-me'
}
