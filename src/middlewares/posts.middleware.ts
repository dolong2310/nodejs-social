import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { EMediaType } from '@/enums/media.enum';
import { EPostAudience, EPostType } from '@/enums/posts.enum';
import { EUserVerificationStatus } from '@/enums/users.enum';
import { AuthFailureError, BadRequestError, ForbiddenError, NotFoundError } from '@/models/error.response';
import { ICreatePostRequestBody, IGetPostDetailRequestParams } from '@/models/requests/post.request';
import { IPostDetailResponse } from '@/models/responses/post.response';
import followersService from '@/services/followers.service';
import postsService from '@/services/posts.service';
import usersService from '@/services/users.service';
import { IMedia } from '@/types/media.type';
import { validate } from '@/utils/validation.util';
import { NextFunction, Request, Response } from 'express';
import { checkSchema, Meta, ParamSchema } from 'express-validator';
import { isEmpty } from 'lodash-es';
import { ObjectId } from 'mongodb';

export const postIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.POST_ID_IS_REQUIRED
  },
  isString: {
    errorMessage: VALIDATION_ERROR_MESSAGE.POST_ID_MUST_BE_A_STRING
  },
  trim: true,
  custom: {
    options: async (postId: string, { req }: Meta) => {
      if (!ObjectId.isValid(postId)) {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_POST_ID);
      }

      const postDetail = await postsService.findPostDetail(postId);
      if (!postDetail) {
        throw new NotFoundError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
      }

      req.postDetail = postDetail;
      return true;
    }
  }
};

export const validateCreatePost = validate(
  checkSchema(
    {
      // type phải là 1 trong 4 giá trị: post, repost, comment, quote
      type: {
        isIn: {
          options: [[EPostType.POST, EPostType.REPOST, EPostType.COMMENT, EPostType.QUOTE]],
          errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_POST_TYPE
        },
        trim: true
      },
      // audience phải là 1 trong 3 giá trị: public, followers, only_me
      audience: {
        isIn: {
          options: [[EPostAudience.PUBLIC, EPostAudience.FOLLOWERS, EPostAudience.ONLY_ME]],
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

            if (type === EPostType.REPOST && content !== '') {
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_EMPTY_STRING);
            }

            // if (!content) {
            //   throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONTENT_IS_REQUIRED);
            // }

            // if (content.length < 1 || content.length > 1000) {
            //   throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONTENT_LENGTH_MUST_BE_FROM_1_TO_1000);
            // }

            if (
              [EPostType.POST, EPostType.COMMENT, EPostType.QUOTE].includes(type) &&
              isEmpty(mentions) &&
              isEmpty(hashtags) &&
              content === ''
            ) {
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_A_NON_EMPTY_STRING);
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

            if ([EPostType.REPOST, EPostType.COMMENT, EPostType.QUOTE].includes(type)) {
              // parentId không được null, phải là string hợp lệ (ObjectId)
              if (parentId === null || typeof parentId !== 'string' || !ObjectId.isValid(parentId)) {
                throw new BadRequestError(VALIDATION_ERROR_MESSAGE.PARENT_ID_MUST_BE_A_VALID_POST_ID);
              }
            }

            if (type === EPostType.POST && parentId !== null) {
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.PARENT_ID_MUST_BE_NULL);
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
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRINGS);
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
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY_OF_VALID_USER_IDS);
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
            const validMediaTypes = Object.values(EMediaType); // ['image', 'video', 'video-hls']
            if (
              mediaItems.length > 0 &&
              mediaItems.some((item) => typeof item.url !== 'string' || !validMediaTypes.includes(item.type))
            ) {
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_AN_ARRAY_OF_VALID_MEDIA_ITEMS);
            }

            return true;
          }
        }
      }
    },
    ['body']
  )
);

export const validatePostId = validate(
  checkSchema(
    {
      postId: postIdSchema
    },
    ['params']
  )
);

export const validateAudience = async (
  req: Request<IGetPostDetailRequestParams>,
  res: Response,
  next: NextFunction
) => {
  const userId = req.accessTokenPayload?.userId;
  const post = req.postDetail as IPostDetailResponse;

  // kiểm tra user chưa login (guest user) thì chỉ được xem bài post có chế độ "public"
  const isGuestUser = !userId;
  if (isGuestUser) {
    if (post.audience !== EPostAudience.PUBLIC) {
      throw new AuthFailureError();
    }
  }

  const ownerId = post.userId.toString();

  const isOwner = isGuestUser ? false : post.userId.equals(userId);
  const isFollower = isGuestUser
    ? false
    : await followersService.findFollower({ myUserId: userId, followedUserId: ownerId }, { projection: { _id: 1 } });
  const isMention = isGuestUser ? false : post.mentions.map((mention) => mention.toString()).includes(userId);

  // kiểm tra user owner của bài post có bị banned không
  const userOwner = await usersService.findUserById(ownerId);
  if (!userOwner) {
    throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
  }
  if (isOwner && userOwner.verificationStatus === EUserVerificationStatus.BANNED) {
    throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_IS_BANNED);
  }

  // kiểm tra bài post có chế độ "only me" thì chỉ user owner mới được xem bài post
  if (post.audience === EPostAudience.ONLY_ME) {
    if (!isOwner) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.ONLY_OWNER_CAN_VIEW_POSTS);
    }
  }

  // kiểm tra bài post có chế độ "followers" thì chỉ user followers hoặc owner hoặc mentions mới được xem bài post
  if (post.audience === EPostAudience.FOLLOWERS) {
    if (!isFollower && !isOwner && !isMention) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.ONLY_FOLLOWERS_CAN_VIEW_POSTS);
    }
  }

  // bài post có chế độ "public" thì mọi người đều được xem bài post => không cần kiểm tra
  next();
};

export const validatePostType = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [[EPostType.POST, EPostType.REPOST, EPostType.COMMENT, EPostType.QUOTE]],
          errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_POST_TYPE
        },
        trim: true
      },
      postId: postIdSchema
    },
    ['params']
  )
);

export const validatePaginationQuery = validate(
  checkSchema(
    {
      page: {
        isNumeric: true,
        custom: {
          options: async (value: string) => {
            const page = Number(value);

            if (page < 1) {
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.PAGE_MUST_BE_GREATER_THAN_0);
            }

            return true;
          }
        }
      },
      limit: {
        isNumeric: true,
        custom: {
          options: async (value: string) => {
            const limit = Number(value);

            if (limit < 1 || limit > 100) {
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.LIMIT_MUST_BE_BETWEEN_1_TO_100);
            }

            return true;
          }
        }
      }
    },
    ['query']
  )
);
