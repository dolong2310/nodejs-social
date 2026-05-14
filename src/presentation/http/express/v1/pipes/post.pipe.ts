import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import { EnumPostAudience, EnumPostType } from '@/modules/post/domain/entities/post.type';
import { Media } from '@/modules/post/domain/value-objects/media.value-object';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import {
  HashtagsCountMustBeBetween0To20Exception,
  HashtagsMustBeArrayOfStringsException,
  InvalidPostIdException,
  MediaMustBeArrayOfValidItemsException,
  MediaMustBeEmptyForThisPostTypeException,
  MentionsMustBeArrayOfValidUserIdsException,
  ParentIdMustBeNullException,
  ParentIdMustBeValidPostIdException,
  PostContentMustBeEmptyStringException,
  PostContentMustBeNonEmptyStringException,
  PostContentOrMediaRequiredException,
  RepostHashtagsMustBeEmptyException,
  RepostMentionsMustBeEmptyException
} from '@/presentation/http/express/exceptions/post.exception';
import { ExpressRequestHandler } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { CreatePostRequestDTO } from '@/presentation/http/express/v1/dtos/post/post.request.dto';
import { checkSchema, Location } from 'express-validator';

export interface IPostPipe {
  postIdPipe: (key: string, location: Location) => ExpressRequestHandler;
  createPostPipe: ExpressRequestHandler;
  patchPostPipe: ExpressRequestHandler;
  postTypePipe: ExpressRequestHandler;
}

const MAX_HASHTAGS_PER_POST = 20;

export class PostsPipe implements IPostPipe {
  private static isValidMediaItem(item: Media): boolean {
    const raw = item.raw();
    return (
      typeof raw.url === 'string' &&
      [EnumMediaType.IMAGE, EnumMediaType.VIDEO, EnumMediaType.VIDEO_STREAM].includes(raw.type as EnumMediaType)
    );
  }

  createPostPipe = validate(
    checkSchema(
      {
        // type phải là 1 trong 4 giá trị: post, repost, comment, quote
        type: {
          isIn: {
            options: [[EnumPostType.POST, EnumPostType.REPOST, EnumPostType.COMMENT, EnumPostType.QUOTE]],
            errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_POST_TYPE
          },
          trim: true
        },
        audience: {
          isIn: {
            options: [[EnumPostAudience.PUBLIC, EnumPostAudience.FRIENDS_ONLY, EnumPostAudience.ONLY_ME]],
            errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_POST_AUDIENCE
          },
          trim: true
        },
        allowStrangerComments: {
          isBoolean: {
            errorMessage: VALIDATION_ERROR_MESSAGE.ALLOW_STRANGER_COMMENTS_MUST_BE_BOOLEAN
          }
        },
        // POST hợp lệ khi có content hoặc media; COMMENT/QUOTE phải có content; REPOST không có content riêng.
        content: {
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_A_STRING
          },
          trim: true,
          custom: {
            options: (content: string, { req }) => {
              const { type, media } = req.body as CreatePostRequestDTO;

              if (type === EnumPostType.REPOST && content !== '') {
                throw PostContentMustBeEmptyStringException;
              }

              if (type === EnumPostType.POST && content === '' && media.length === 0) {
                throw PostContentOrMediaRequiredException;
              }

              if ([EnumPostType.COMMENT, EnumPostType.QUOTE].includes(type) && content === '') {
                throw PostContentMustBeNonEmptyStringException;
              }

              return true;
            }
          }
        },
        // nếu type là repost, comment, quote thì parentId phải là postId của bài viết cha (không được null hoặc string rỗng)
        // nếu type là post thì parentId phải là null
        parentId: {
          custom: {
            options: (parentId: string | null, { req }) => {
              const { type } = req.body as CreatePostRequestDTO;

              if ([EnumPostType.REPOST, EnumPostType.COMMENT, EnumPostType.QUOTE].includes(type)) {
                // parentId không được null, phải là string hợp lệ (ObjectId)
                if (parentId === null || typeof parentId !== 'string' || !isValidId(parentId)) {
                  throw ParentIdMustBeValidPostIdException;
                }
              }

              if (type === EnumPostType.POST && parentId !== null) {
                throw ParentIdMustBeNullException;
              }

              return true;
            }
          }
        },
        // hashtags phải là mảng các string
        hashtags: {
          isArray: {
            errorMessage: VALIDATION_ERROR_MESSAGE.HASHTAGS_MUST_BE_AN_ARRAY
          },
          custom: {
            options: (hashtags: string[], { req }) => {
              const { type } = req.body as CreatePostRequestDTO;
              if (type === EnumPostType.REPOST && hashtags.length > 0) {
                throw RepostHashtagsMustBeEmptyException;
              }

              if (hashtags.length > MAX_HASHTAGS_PER_POST) {
                throw HashtagsCountMustBeBetween0To20Exception;
              }

              if (hashtags.length > 0 && !hashtags.every((hashtag) => typeof hashtag === 'string')) {
                throw HashtagsMustBeArrayOfStringsException;
              }

              return true;
            }
          }
        },
        // mentions phải là mảng các userId
        mentions: {
          isArray: {
            errorMessage: VALIDATION_ERROR_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY
          },
          custom: {
            options: (userIds: string[], { req }) => {
              const { type } = req.body as CreatePostRequestDTO;
              if (type === EnumPostType.REPOST && userIds.length > 0) {
                throw RepostMentionsMustBeEmptyException;
              }

              if (userIds.length > 0 && !userIds.every((userId) => isValidId(userId))) {
                throw MentionsMustBeArrayOfValidUserIdsException;
              }

              return true;
            }
          }
        },
        // media phải là mảng các media
        media: {
          isArray: {
            errorMessage: VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_AN_ARRAY
          },
          custom: {
            options: (mediaItems: Media[], { req }) => {
              const { type } = req.body as CreatePostRequestDTO;
              if (
                [EnumPostType.REPOST, EnumPostType.COMMENT, EnumPostType.QUOTE].includes(type) &&
                mediaItems.length > 0
              ) {
                throw MediaMustBeEmptyForThisPostTypeException;
              }

              if (mediaItems.length > 0 && mediaItems.some((item) => !PostsPipe.isValidMediaItem(item))) {
                throw MediaMustBeArrayOfValidItemsException;
              }

              return true;
            }
          }
        }
      },
      ['body']
    )
  );

  patchPostPipe = validate(
    checkSchema(
      {
        audience: {
          optional: true,
          isIn: {
            options: [[EnumPostAudience.PUBLIC, EnumPostAudience.FRIENDS_ONLY, EnumPostAudience.ONLY_ME]],
            errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_POST_AUDIENCE
          },
          trim: true
        },
        allowStrangerComments: {
          optional: true,
          isBoolean: {
            errorMessage: VALIDATION_ERROR_MESSAGE.ALLOW_STRANGER_COMMENTS_MUST_BE_BOOLEAN
          }
        },
        content: {
          optional: true,
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_A_STRING
          },
          trim: true
        },
        hashtags: {
          optional: true,
          isArray: {
            errorMessage: VALIDATION_ERROR_MESSAGE.HASHTAGS_MUST_BE_AN_ARRAY
          },
          custom: {
            options: (hashtags: string[]) => {
              if (hashtags.length > MAX_HASHTAGS_PER_POST) {
                throw HashtagsCountMustBeBetween0To20Exception;
              }

              if (hashtags.length > 0 && !hashtags.every((hashtag) => typeof hashtag === 'string')) {
                throw HashtagsMustBeArrayOfStringsException;
              }

              return true;
            }
          }
        },
        mentions: {
          optional: true,
          isArray: {
            errorMessage: VALIDATION_ERROR_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY
          },
          custom: {
            options: (userIds: string[]) => {
              if (userIds.length > 0 && !userIds.every((userId) => isValidId(userId))) {
                throw MentionsMustBeArrayOfValidUserIdsException;
              }

              return true;
            }
          }
        },
        media: {
          optional: true,
          isArray: {
            errorMessage: VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_AN_ARRAY
          },
          custom: {
            options: (mediaItems: Media[]) => {
              if (mediaItems.length > 0 && mediaItems.some((item) => !PostsPipe.isValidMediaItem(item))) {
                throw MediaMustBeArrayOfValidItemsException;
              }

              return true;
            }
          }
        }
      },
      ['body']
    )
  );

  postIdPipe = (key: string, location: Location) =>
    validate(
      checkSchema(
        {
          [key]: {
            notEmpty: {
              errorMessage: VALIDATION_ERROR_MESSAGE.POST_ID_IS_REQUIRED
            },
            isString: {
              errorMessage: VALIDATION_ERROR_MESSAGE.POST_ID_MUST_BE_A_STRING
            },
            trim: true,
            custom: {
              options: (postId: string) => {
                if (!isValidId(postId)) {
                  throw InvalidPostIdException;
                }
                return true;
              }
            }
          }
        },
        [location]
      )
    );

  postTypePipe = validate(
    checkSchema(
      {
        type: {
          isIn: {
            options: [[EnumPostType.POST, EnumPostType.REPOST, EnumPostType.COMMENT, EnumPostType.QUOTE]],
            errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_POST_TYPE
          },
          trim: true
        }
      },
      ['params']
    )
  );
}
