import { EPostAudience, EPostType } from '@/modules/post/domain/entities/post.type';
import { EMediaType } from '@/modules/common/domain/enums/media.enum';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
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
  optional,
  pipe,
  string,
  url
} from 'valibot';

export const postSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  userId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  type: enum_(EPostType),
  audience: enum_(EPostAudience),
  allowStrangerComments: boolean(),
  content: string(),
  parentId: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  hashtags: array(pipe(string(), minLength(ENTITY_ID_LENGTH))),
  mentions: array(pipe(string(), minLength(ENTITY_ID_LENGTH))),
  media: array(
    object({
      url: pipe(string(), nonEmpty('Please enter your url.'), url('The url is badly formatted.')),
      type: enum_(EMediaType)
    })
  ),
  guestViews: optional(number(), 0),
  userViews: optional(number(), 0),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type PostModel = InferOutput<typeof postSchema>;
