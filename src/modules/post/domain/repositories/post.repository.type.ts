import { CreatePostProps, EnumPostAudience } from '@/modules/post/domain/entities/post.type';
import { Media } from '@/modules/post/domain/value-objects/media.value-object';

export interface CreatePostInput extends CreatePostProps {}

export interface UpdatePostInput {
  postId: string;
  ownerUserId: string;
  audience?: EnumPostAudience;
  allowStrangerComments?: boolean;
  content?: string;
  hashtags?: string[];
  mentions?: string[];
  media?: Media[];
}

export interface DeletePostTreeInput {
  postId: string;
  actorId: string;
}
