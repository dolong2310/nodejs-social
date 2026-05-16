import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { EnumPostAudience, EnumPostType } from '@/modules/post/domain/entities/post.type';
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
  type: enum_(EnumPostType),
  audience: enum_(EnumPostAudience),
  allow_stranger_comments: boolean(),
  content: string(),
  parent_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  hashtags: array(pipe(string(), minLength(ENTITY_ID_LENGTH))),
  mentions: array(pipe(string(), minLength(ENTITY_ID_LENGTH))),
  media: array(
    object({
      url: pipe(string(), nonEmpty('Please enter your url.'), url('The url is badly formatted.')),
      type: enum_(EnumMediaType)
    })
  ),
  guest_views: number(),
  user_views: number(),
  created_at: date(),
  created_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  updated_at: date(),
  updated_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  deleted_at: nullable(date(), null),
  deleted_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)
});

export type PostModel = InferOutput<typeof postSchema>;
