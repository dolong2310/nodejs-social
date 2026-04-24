import { CreatePostProps, EPostAudience } from '@/domain/entities/post/post.type';

export interface IIncreasePostViewsInput {
  postId: string;
  userId?: string;
}

export interface ICreatePostInput extends CreatePostProps {}

export interface IUpdatePostAudienceAndStrangerCommentsInput {
  postId: string;
  ownerUserId: string;
  audience: EPostAudience;
  allowStrangerComments: boolean;
}

export interface IIncreasePostsViewsInput {
  ids: string[];
  isAuthenticatedViewer: boolean;
}
