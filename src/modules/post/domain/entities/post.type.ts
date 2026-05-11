import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { Prettify } from 'ts-essentials';

export interface PostProps {
  userId: string;
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
}

export interface PostFullProps extends Prettify<PostProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreatePostProps extends PostProps {}

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
