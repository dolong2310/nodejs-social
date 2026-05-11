import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { EPostAudience, EPostType } from '@/modules/post/domain/entities/post.type';
import { type InferOutput, boolean, date, enum_, minLength, nullable, object, pipe, string } from 'valibot';

export const postSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  type: enum_(EPostType),
  audience: enum_(EPostAudience),
  allow_stranger_comments: boolean(),
  content: string(),
  parent_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  created_at: date(),
  updated_at: date()
});

export type PostModel = InferOutput<typeof postSchema>;
