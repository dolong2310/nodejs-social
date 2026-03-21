import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { CreatePostRequestDTO, GetPostDetailParamsDTO, PatchPostRequestDTO } from '@/dtos/requests/post.request.dto';
import { PostDetailResponseDTO } from '@/dtos/responses/post.response.dto';
import { EMediaType } from '@/enums/media.enum';
import { EPostAudience, EPostType } from '@/enums/posts.enum';
import { EUserVerificationStatus } from '@/enums/users.enum';
import { IBlockRepository } from '@/repositories/block.repository';
import { AuthFailureError, BadRequestError, ForbiddenError, NotFoundError } from '@/responses/error.response';
import { IFriendsService } from '@/services/friends.service';
import { IPostsService } from '@/services/posts.service';
import { IUsersService } from '@/services/users.service';
import { IMedia } from '@/types/media.type';
import { isValidMongoId } from '@/utils/common.util';
import { validate } from '@/utils/validation.util';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema, Location, Meta } from 'express-validator';
import { isEmpty } from 'lodash-es';
import { ObjectId } from 'mongodb';

export interface IPostsValidation {
  createPostValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  postIdValidation: (
    key: string,
    location: Location
  ) => RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  audienceValidation: RequestHandler<GetPostDetailParamsDTO, object, object, Query, Record<string, unknown>>;
  patchPostValidation: RequestHandler<GetPostDetailParamsDTO, object, PatchPostRequestDTO, Query, Record<string, unknown>>;
  postTypeValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

class PostsValidation implements IPostsValidation {
  constructor(
    private readonly postsService: IPostsService,
    private readonly usersService: IUsersService,
    private readonly friendsService: IFriendsService,
    private readonly blockRepository: IBlockRepository
  ) {}

  createPostValidation = validate(
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
        audience: {
          isIn: {
            options: [[EPostAudience.PUBLIC, EPostAudience.FRIENDS_ONLY, EPostAudience.ONLY_ME]],
            errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_POST_AUDIENCE
          },
          trim: true
        },
        allowStrangerComments: {
          isBoolean: {
            errorMessage: VALIDATION_ERROR_MESSAGE.ALLOW_STRANGER_COMMENTS_MUST_BE_BOOLEAN
          }
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
              const { type, mentions, hashtags } = req.body as CreatePostRequestDTO;

              if (type === EPostType.REPOST && content !== '') {
                throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_EMPTY_STRING);
              }

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
              const { type } = req.body as CreatePostRequestDTO;

              if ([EPostType.REPOST, EPostType.COMMENT, EPostType.QUOTE].includes(type)) {
                // parentId không được null, phải là string hợp lệ (ObjectId)
                if (parentId === null || typeof parentId !== 'string' || !isValidMongoId(parentId)) {
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
              if (userIds.length > 0 && !userIds.every((userId) => isValidMongoId(userId))) {
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

  patchPostValidation = validate(
    checkSchema(
      {
        audience: {
          isIn: {
            options: [[EPostAudience.PUBLIC, EPostAudience.FRIENDS_ONLY, EPostAudience.ONLY_ME]],
            errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_POST_AUDIENCE
          },
          trim: true
        },
        allowStrangerComments: {
          isBoolean: {
            errorMessage: VALIDATION_ERROR_MESSAGE.ALLOW_STRANGER_COMMENTS_MUST_BE_BOOLEAN
          }
        }
      },
      ['body']
    )
  );

  postIdValidation = (key: string, location: Location) => {
    return validate(
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
              options: async (postId: string, { req }: Meta) => {
                if (!isValidMongoId(postId)) {
                  throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_POST_ID);
                }

                const postDetail = await this.postsService.findPostDetail(postId);

                if (!postDetail) {
                  throw new NotFoundError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
                }

                (req as Request).postDetail = postDetail;

                return true;
              }
            }
          }
        },
        [location]
      )
    );
  };

  audienceValidation = async (
    req: Request<GetPostDetailParamsDTO, object, object, Query, Record<string, unknown>>,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.tokenPayload?.userId;
    const post = req.postDetail as PostDetailResponseDTO;

    if (userId) {
      const blocked = await this.blockRepository.isBlockedEitherWay(new ObjectId(userId), post.userId);
      if (blocked) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CANNOT_VIEW_POST_BLOCKED);
      }
    }

    const audienceStr = post.audience as string;
    const isPublicAudience = audienceStr === EPostAudience.PUBLIC;
    const isFriendsOnlyAudience =
      audienceStr === EPostAudience.FRIENDS_ONLY || audienceStr === 'followers';
    const isOnlyMeAudience = audienceStr === EPostAudience.ONLY_ME || audienceStr === 'only_me';

    // kiểm tra user chưa login (guest user) thì chỉ được xem bài post có chế độ "public"
    const isGuestUser = !userId;
    if (isGuestUser) {
      if (!isPublicAudience) {
        throw new AuthFailureError();
      }
    }

    const ownerId = post.userId.toString();

    const isOwner = isGuestUser ? false : post.userId.equals(userId);
    const isFriend = isGuestUser ? false : await this.friendsService.isFriendOf(userId, ownerId);
    const isMention = isGuestUser ? false : post.mentions.map((mention) => mention.toString()).includes(userId);

    // kiểm tra user owner của bài post có bị banned không
    const userOwner = await this.usersService.findUserById(ownerId);
    if (!userOwner) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }
    if (isOwner && userOwner.verificationStatus === EUserVerificationStatus.BANNED) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_IS_BANNED);
    }

    // kiểm tra bài post có chế độ "only me" thì chỉ user owner mới được xem bài post
    if (isOnlyMeAudience) {
      if (!isOwner) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.ONLY_OWNER_CAN_VIEW_POSTS);
      }
    }

    // friends-only (legacy DB: "followers") — chỉ bạn bè, owner, hoặc mentions
    if (isFriendsOnlyAudience) {
      if (!isFriend && !isOwner && !isMention) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.ONLY_FRIENDS_CAN_VIEW_POSTS);
      }
    }

    // bài post có chế độ "public" thì mọi người đều được xem bài post => không cần kiểm tra
    next();
  };

  postTypeValidation = validate(
    checkSchema(
      {
        type: {
          isIn: {
            options: [[EPostType.POST, EPostType.REPOST, EPostType.COMMENT, EPostType.QUOTE]],
            errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_POST_TYPE
          },
          trim: true
        }
      },
      ['params']
    )
  );
}

export default PostsValidation;
