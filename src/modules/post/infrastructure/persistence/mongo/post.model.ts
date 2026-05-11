import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { EPostAudience, EPostType } from '@/modules/post/domain/entities/post.type';
import { type InferOutput, boolean, date, enum_, minLength, nullable, object, optional, pipe, string } from 'valibot';

export const postSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  type: enum_(EPostType),
  audience: enum_(EPostAudience),
  allow_stranger_comments: boolean(),
  content: string(),
  parent_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  created_at: optional(date(), new Date()),
  updated_at: optional(date(), new Date())
});

export type PostModel = InferOutput<typeof postSchema>;
