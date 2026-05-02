import { CreatePostProps, EPostAudience } from '@/modules/post/domain/entities/post.type';

export interface ICreatePostInput extends CreatePostProps {}

export interface IUpdatePostAudienceAndStrangerCommentsInput {
  postId: string;
  ownerUserId: string;
  audience: EPostAudience;
  allowStrangerComments: boolean;
}
