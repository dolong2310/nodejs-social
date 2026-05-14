import { CreatePostProps, EnumPostAudience } from '@/modules/post/domain/entities/post.type';

export interface CreatePostInput extends CreatePostProps {}

export interface UpdatePostAudienceAndStrangerCommentsInput {
  postId: string;
  ownerUserId: string;
  audience: EnumPostAudience;
  allowStrangerComments: boolean;
}
