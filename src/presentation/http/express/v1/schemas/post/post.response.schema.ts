import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { EnumPostAudience, EnumPostType } from '@/modules/post/domain/entities/post.types';
import type { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.types';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.types';
import {
  array,
  boolean,
  enum_,
  type GenericSchema,
  type InferOutput,
  lazy,
  nullable,
  nullish,
  number,
  object,
  optional,
  string
} from 'valibot';
import { responseDateSchema } from '@/presentation/http/express/v1/schemas/common/response.schema';

const mediaResponseSchema = object({ url: string(), type: enum_(EnumMediaType) });

const postBaseEntries = {
  id: string(),
  userId: string(),
  type: enum_(EnumPostType),
  audience: enum_(EnumPostAudience),
  allowStrangerComments: boolean(),
  content: string(),
  parentId: nullable(string()),
  media: array(mediaResponseSchema),
  guestViews: nullish(number(), 0),
  userViews: nullish(number(), 0),
  createdAt: responseDateSchema,
  updatedAt: responseDateSchema
};

export const PostResponseSchema = object({
  ...postBaseEntries,
  hashtags: array(string()),
  mentions: array(string())
});
export type PostResponse = InferOutput<typeof PostResponseSchema>;

const hashtagResponseSchema = object({
  id: string(),
  name: string(),
  createdAt: responseDateSchema,
  updatedAt: responseDateSchema
});

const mentionPreviewSchema = object({
  id: string(),
  name: string(),
  email: string(),
  username: optional(string()),
  status: enum_(EnumUserStatus)
});

const authorPreviewSchema = object({
  id: string(),
  name: string(),
  email: string(),
  username: optional(string()),
  avatar: optional(string())
});

/**
 * Post detail with author, counters and the (recursive) source post for repost/quote/comment.
 * Typed as `GenericSchema` because valibot cannot infer recursive schemas.
 */
export const PostDetailWithAuthorResponseSchema: GenericSchema = object({
  ...postBaseEntries,
  hashtags: array(hashtagResponseSchema),
  mentions: array(mentionPreviewSchema),
  likeCount: number(),
  bookmarkCount: number(),
  likedByMe: boolean(),
  bookmarkedByMe: boolean(),
  repostCount: number(),
  commentCount: number(),
  quoteCount: number(),
  author: authorPreviewSchema,
  sourcePost: nullish(
    lazy(() => PostDetailWithAuthorResponseSchema),
    null
  )
});

/** Output type of `PostDetailWithAuthorResponseSchema` (recursive, so declared by hand). */
export type PostDetailWithAuthorResponse = PostDetailWithAuthorOutput;

/** Bookmark and like share the same shape. */
export const PostInteractionResponseSchema = object({
  id: string(),
  userId: string(),
  postId: string(),
  createdAt: responseDateSchema,
  updatedAt: responseDateSchema
});
export type PostInteractionResponse = InferOutput<typeof PostInteractionResponseSchema>;
