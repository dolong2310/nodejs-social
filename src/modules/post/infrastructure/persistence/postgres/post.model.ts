import { EMediaType } from '@/modules/common/domain/enums/media.enum';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { EPostAudience, EPostType } from '@/modules/post/domain/entities/post.type';
import {
  type InferOutput,
  array,
  boolean,
  date,
  enum_,
  minLength,
  nonEmpty,
  nullable,
  number,
  object,
  pipe,
  string,
  url
} from 'valibot';

export const postSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  type: enum_(EPostType),
  audience: enum_(EPostAudience),
  allow_stranger_comments: boolean(),
  content: string(),
  parent_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  hashtags: array(pipe(string(), minLength(ENTITY_ID_LENGTH))),
  mentions: array(pipe(string(), minLength(ENTITY_ID_LENGTH))),
  media: array(
    object({
      url: pipe(string(), nonEmpty('Please enter your url.'), url('The url is badly formatted.')),
      type: enum_(EMediaType)
    })
  ),
  guest_views: number(),
  user_views: number(),
  created_at: date(),
  updated_at: date()
});

export type PostModel = InferOutput<typeof postSchema>;
