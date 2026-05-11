import { EPostAudience, EPostType, PostFullProps } from '@/modules/post/domain/entities/post.type';
import { Media } from '@/modules/post/domain/value-objects/media.value-object';

export interface IPublishPostInput {
  userId: string;
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtagIds: string[];
  mentionedUserIds: string[];
  media: Media[];
}

export interface IIncreasePostViewsInput {
  postId: string;
  userId?: string;
}

export interface IIncreasePostsViewsInput {
  ids: string[];
  isAuthenticatedViewer: boolean;
}

// Output

export interface IPublishPostOutput extends PostFullProps {}

export interface IIncreasePostViewsOutput {
  userViews: number;
  guestViews: number;
  updatedAt: Date;
}
