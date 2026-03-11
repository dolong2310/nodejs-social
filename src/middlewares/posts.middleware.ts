import HTTP_STATUS from '@/constants/httpStatus.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { MediaType } from '@/enums/media.enum';
import { PostAudience, PostType } from '@/enums/posts.enum';
import { ErrorWithStatus } from '@/models/error.model';
import { ICreatePostRequestBody } from '@/models/requests/post.request';
import { IMedia } from '@/types/media.type';
import { validate } from '@/utils/validation.util';
import { checkSchema } from 'express-validator';
import { isEmpty } from 'lodash-es';
import { ObjectId } from 'mongodb';

export const validateCreatePost = validate(
  checkSchema(
    {
      // type phải là 1 trong 4 giá trị: post, repost, comment, quote
      type: {
        isIn: {
          options: [[PostType.POST, PostType.REPOST, PostType.COMMENT, PostType.QUOTE]],
          errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_POST_TYPE
        },
        trim: true
      },
      // audience phải là 1 trong 3 giá trị: public, friends, only_me
      audience: {
        isIn: {
          options: [[PostAudience.PUBLIC, PostAudience.FRIENDS, PostAudience.ONLY_ME]],
          errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_POST_AUDIENCE
        },
        trim: true
      },
      // nếu type là repost thì content phải là '' (string rỗng)
      // nếu type là post, comment, quote và không có mentions, hashtags thì content phải là string không được rỗng
      content: {
        isString: {
          errorMessage: VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_A_STRING
        },
        trim: true,
        custom: {
          options: async (content: string, { req }) => {
            const { type, mentions, hashtags } = req.body as ICreatePostRequestBody;

            if (type === PostType.REPOST && content !== '') {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_EMPTY_STRING,
                status: HTTP_STATUS.BAD_REQUEST
              });
            }

            // if (!content) {
            //   throw new ErrorWithStatus({
            //     message: VALIDATION_ERROR_MESSAGE.CONTENT_IS_REQUIRED,
            //     status: HTTP_STATUS.BAD_REQUEST
            //   });
            // }

            // if (content.length < 1 || content.length > 1000) {
            //   throw new ErrorWithStatus({
            //     message: VALIDATION_ERROR_MESSAGE.CONTENT_LENGTH_MUST_BE_FROM_1_TO_1000,
            //     status: HTTP_STATUS.BAD_REQUEST
            //   });
            // }

            if (
              [PostType.POST, PostType.COMMENT, PostType.QUOTE].includes(type) &&
              isEmpty(mentions) &&
              isEmpty(hashtags) &&
              content === ''
            ) {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_A_NON_EMPTY_STRING,
                status: HTTP_STATUS.BAD_REQUEST
              });
            }

            return true;
          }
        }
      },
      // nếu type là repost, comment, quote thì parentId phải là postId của bài viết cha (không được null hoặc string rỗng)
      // nếu type là post thì parentId phải là null
      parentId: {
        custom: {
          options: async (parentId: string | null, { req }) => {
            const { type } = req.body as ICreatePostRequestBody;

            if ([PostType.REPOST, PostType.COMMENT, PostType.QUOTE].includes(type)) {
              // parentId không được null, phải là string hợp lệ (ObjectId)
              if (parentId === null || typeof parentId !== 'string' || !ObjectId.isValid(parentId)) {
                throw new ErrorWithStatus({
                  message: VALIDATION_ERROR_MESSAGE.PARENT_ID_MUST_BE_A_VALID_POST_ID,
                  status: HTTP_STATUS.BAD_REQUEST
                });
              }
            }

            if (type === PostType.POST && parentId !== null) {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.PARENT_ID_MUST_BE_NULL,
                status: HTTP_STATUS.BAD_REQUEST
              });
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
          options: async (hashtags: string[]) => {
            if (hashtags.length > 0 && !hashtags.every((hashtag) => typeof hashtag === 'string')) {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRINGS,
                status: HTTP_STATUS.BAD_REQUEST
              });
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
          options: async (userIds: string[]) => {
            if (userIds.length > 0 && !userIds.every((userId) => ObjectId.isValid(userId))) {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY_OF_VALID_USER_IDS,
                status: HTTP_STATUS.BAD_REQUEST
              });
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
          options: async (mediaItems: IMedia[]) => {
            const validMediaTypes = Object.values(MediaType); // ['image', 'video', 'video-hls']
            if (
              mediaItems.length > 0 &&
              mediaItems.some((item) => typeof item.url !== 'string' || !validMediaTypes.includes(item.type))
            ) {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_AN_ARRAY_OF_VALID_MEDIA_ITEMS,
                status: HTTP_STATUS.BAD_REQUEST
              });
            }

            return true;
          }
        }
      }
    },
    ['body']
  )
);
