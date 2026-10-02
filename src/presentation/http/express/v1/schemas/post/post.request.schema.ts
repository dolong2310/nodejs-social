import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import { EnumNewFeedFilter, EnumPostAudience, EnumPostType } from '@/modules/post/domain/entities/post.types';
import { Media } from '@/modules/post/domain/value-objects/media.value-object';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { queryObject, requestObject } from '@/presentation/http/express/utils/schema.util';
import { cursorPaginationQueryEntries } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import { idSchema, userIdSchema } from '@/presentation/http/express/v1/schemas/common/primitives.schema';
import {
  array,
  boolean,
  forward,
  maxLength,
  nullable,
  object,
  optional,
  partialCheck,
  picklist,
  pipe,
  rawTransform,
  string,
  trim
} from 'valibot';

const MAX_HASHTAGS_PER_POST = 20;
const POST_TYPES = [EnumPostType.POST, EnumPostType.REPOST, EnumPostType.COMMENT, EnumPostType.QUOTE] as const;
const POST_AUDIENCES = [EnumPostAudience.PUBLIC, EnumPostAudience.FRIENDS_ONLY, EnumPostAudience.ONLY_ME] as const;
const MEDIA_TYPES = [EnumMediaType.IMAGE, EnumMediaType.VIDEO, EnumMediaType.VIDEO_STREAM] as const;

export const postIdSchema = idSchema({
  required: VALIDATION_ERROR_MESSAGE.POST_ID_IS_REQUIRED,
  invalid: VALIDATION_ERROR_MESSAGE.POST_ID_MUST_BE_A_STRING,
  format: VALIDATION_ERROR_MESSAGE.INVALID_POST_ID
});

const postTypeSchema = pipe(
  string(VALIDATION_ERROR_MESSAGE.INVALID_POST_TYPE),
  trim(),
  picklist(POST_TYPES, VALIDATION_ERROR_MESSAGE.INVALID_POST_TYPE)
);

const audienceSchema = pipe(
  string(VALIDATION_ERROR_MESSAGE.INVALID_POST_AUDIENCE),
  trim(),
  picklist(POST_AUDIENCES, VALIDATION_ERROR_MESSAGE.INVALID_POST_AUDIENCE)
);

const allowStrangerCommentsSchema = boolean(VALIDATION_ERROR_MESSAGE.ALLOW_STRANGER_COMMENTS_MUST_BE_BOOLEAN);

const contentSchema = pipe(string(VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_A_STRING), trim());

const hashtagsSchema = pipe(
  array(
    string(VALIDATION_ERROR_MESSAGE.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRINGS),
    VALIDATION_ERROR_MESSAGE.HASHTAGS_MUST_BE_AN_ARRAY
  ),
  maxLength(MAX_HASHTAGS_PER_POST, VALIDATION_ERROR_MESSAGE.HASHTAGS_COUNT_MUST_BE_BETWEEN_0_TO_20)
);

const mentionsSchema = array(
  idSchema({
    required: VALIDATION_ERROR_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY_OF_VALID_USER_IDS,
    invalid: VALIDATION_ERROR_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY_OF_VALID_USER_IDS,
    format: VALIDATION_ERROR_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY_OF_VALID_USER_IDS
  }),
  VALIDATION_ERROR_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY
);

/** Media item → `Media` value object (url must be a valid URL, type one of image/video/video_stream). */
const mediaItemSchema = pipe(
  object(
    {
      url: string(VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_AN_ARRAY_OF_VALID_MEDIA_ITEMS),
      type: picklist(MEDIA_TYPES, VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_AN_ARRAY_OF_VALID_MEDIA_ITEMS)
    },
    VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_AN_ARRAY_OF_VALID_MEDIA_ITEMS
  ),
  rawTransform(({ dataset, addIssue, NEVER }) => {
    try {
      return Media.create(dataset.value);
    } catch {
      addIssue({ message: VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_AN_ARRAY_OF_VALID_MEDIA_ITEMS });
      return NEVER;
    }
  })
);

const mediaSchema = array(mediaItemSchema, VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_AN_ARRAY);

// Params / query --------------------------------------------------------------------------

export const PostIdParamsSchema = requestObject({ postId: postIdSchema });

export const PostIdBodySchema = requestObject({ postId: postIdSchema });

export const PostsByUserParamsSchema = requestObject({ userId: userIdSchema });

export const PostsByUserQuerySchema = queryObject({
  ...cursorPaginationQueryEntries,
  type: optional(postTypeSchema)
});

export const NewFeedsQuerySchema = queryObject({
  ...cursorPaginationQueryEntries,
  filter: optional(
    pipe(
      string(VALIDATION_ERROR_MESSAGE.INVALID_NEW_FEED_FILTER),
      trim(),
      picklist(
        [EnumNewFeedFilter.FOR_YOU, EnumNewFeedFilter.FOLLOWING],
        VALIDATION_ERROR_MESSAGE.INVALID_NEW_FEED_FILTER
      )
    )
  )
});

export const PostsTypeParamsSchema = requestObject({ type: postTypeSchema, postId: postIdSchema });

// Body ------------------------------------------------------------------------------------

/**
 * Rules by type:
 * - POST: parentId null, content or media required.
 * - COMMENT: parentId required, content required, media allowed.
 * - QUOTE: parentId required, content required, no media.
 * - REPOST: parentId required, empty content, no hashtags/mentions/media.
 */
export const CreatePostBodySchema = pipe(
  requestObject({
    type: postTypeSchema,
    audience: audienceSchema,
    allowStrangerComments: allowStrangerCommentsSchema,
    content: contentSchema,
    parentId: nullable(pipe(string(VALIDATION_ERROR_MESSAGE.PARENT_ID_MUST_BE_A_VALID_POST_ID), trim())),
    hashtags: hashtagsSchema,
    mentions: mentionsSchema,
    media: mediaSchema
  }),
  forward(
    partialCheck(
      [['type'], ['parentId']],
      (input) => input.type !== EnumPostType.POST || input.parentId === null,
      VALIDATION_ERROR_MESSAGE.PARENT_ID_MUST_BE_NULL
    ),
    ['parentId']
  ),
  forward(
    partialCheck(
      [['type'], ['parentId']],
      (input) => input.type === EnumPostType.POST || (input.parentId !== null && isValidId(input.parentId)),
      VALIDATION_ERROR_MESSAGE.PARENT_ID_MUST_BE_A_VALID_POST_ID
    ),
    ['parentId']
  ),
  forward(
    partialCheck(
      [['type'], ['content']],
      (input) => input.type !== EnumPostType.REPOST || input.content === '',
      VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_EMPTY_STRING
    ),
    ['content']
  ),
  forward(
    partialCheck(
      [['type'], ['content']],
      (input) => ![EnumPostType.COMMENT, EnumPostType.QUOTE].includes(input.type) || input.content !== '',
      VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_A_NON_EMPTY_STRING
    ),
    ['content']
  ),
  forward(
    partialCheck(
      [['type'], ['content'], ['media']],
      (input) => input.type !== EnumPostType.POST || input.content !== '' || input.media.length > 0,
      VALIDATION_ERROR_MESSAGE.POST_CONTENT_OR_MEDIA_REQUIRED
    ),
    ['content']
  ),
  forward(
    partialCheck(
      [['type'], ['hashtags']],
      (input) => input.type !== EnumPostType.REPOST || input.hashtags.length === 0,
      VALIDATION_ERROR_MESSAGE.REPOST_HASHTAGS_MUST_BE_EMPTY
    ),
    ['hashtags']
  ),
  forward(
    partialCheck(
      [['type'], ['mentions']],
      (input) => input.type !== EnumPostType.REPOST || input.mentions.length === 0,
      VALIDATION_ERROR_MESSAGE.REPOST_MENTIONS_MUST_BE_EMPTY
    ),
    ['mentions']
  ),
  forward(
    partialCheck(
      [['type'], ['media']],
      (input) => ![EnumPostType.REPOST, EnumPostType.QUOTE].includes(input.type) || input.media.length === 0,
      VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_EMPTY_FOR_THIS_POST_TYPE
    ),
    ['media']
  )
);

export const PatchPostBodySchema = requestObject({
  audience: optional(audienceSchema),
  allowStrangerComments: optional(allowStrangerCommentsSchema),
  content: optional(contentSchema),
  hashtags: optional(hashtagsSchema),
  mentions: optional(mentionsSchema),
  media: optional(mediaSchema)
});
