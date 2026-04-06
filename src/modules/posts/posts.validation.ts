import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { AutoBind } from '@/decorators/autoBind.decorator';
import { Injectable } from '@/decorators/injectable.decorator';
import { IMedia } from '@/interfaces/types/media.type';
import { BlockRepository } from '@/modules/blocks/blocks.repository';
import { FriendsService } from '@/modules/friends/friends.service';
import { EMediaType } from '@/modules/media/media.enum';
import {
  CreatePostRequestDTO,
  GetPostDetailParamsDTO,
  PatchPostRequestDTO
} from '@/modules/posts/dtos/posts.request.dto';
import { PostDetailResponseDTO } from '@/modules/posts/dtos/posts.response.dto';
import { EPostAudience, EPostType } from '@/modules/posts/posts.enum';
import {
  CannotViewPostBlockedException,
  GuestCannotAccessNonPublicPostException,
  HashtagsCountMustBeBetween0To20Exception,
  HashtagsMustBeArrayOfStringsException,
  InvalidPostIdException,
  MediaMustBeArrayOfValidItemsException,
  MentionsMustBeArrayOfValidUserIdsException,
  OnlyFriendsCanViewPostsException,
  OnlyOwnerCanViewPostsException,
  ParentIdMustBeNullException,
  ParentIdMustBeValidPostIdException,
  PostContentMustBeEmptyStringException,
  PostContentMustBeNonEmptyStringException,
  PostNotFoundException
} from '@/modules/posts/posts.exception';
import { PostsService } from '@/modules/posts/posts.service';
import { EUserVerificationStatus } from '@/modules/users/users.enum';
import { UserIsBannedException, UsersUserNotFoundException } from '@/modules/users/users.exception';
import { UsersService } from '@/modules/users/users.service';
import { redactPostDetailBlockedAuthor } from '@/utils/block-redaction.util';
import { isValidMongoId } from '@/utils/common.util';
import { validate } from '@/utils/validation.util';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema, Location, Meta } from 'express-validator';
import { isEmpty } from 'lodash-es';

export interface IPostsValidation {
  createPostValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  postIdValidation: (
    key: string,
    location: Location
  ) => RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  audienceValidation: RequestHandler<GetPostDetailParamsDTO, object, object, Query, Record<string, unknown>>;
  patchPostValidation: RequestHandler<
    GetPostDetailParamsDTO,
    object,
    PatchPostRequestDTO,
    Query,
    Record<string, unknown>
  >;
  postTypeValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

@Injectable()
export class PostsValidation implements IPostsValidation {
  private static readonly MAX_HASHTAGS_PER_POST = 20;

  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
    private readonly friendsService: FriendsService,
    private readonly blockRepository: BlockRepository
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
                throw PostContentMustBeEmptyStringException;
              }

              if (
                [EPostType.POST, EPostType.COMMENT, EPostType.QUOTE].includes(type) &&
                isEmpty(mentions) &&
                isEmpty(hashtags) &&
                content === ''
              ) {
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
            options: async (parentId: string | null, { req }) => {
              const { type } = req.body as CreatePostRequestDTO;

              if ([EPostType.REPOST, EPostType.COMMENT, EPostType.QUOTE].includes(type)) {
                // parentId không được null, phải là string hợp lệ (ObjectId)
                if (parentId === null || typeof parentId !== 'string' || !isValidMongoId(parentId)) {
                  throw ParentIdMustBeValidPostIdException;
                }
              }

              if (type === EPostType.POST && parentId !== null) {
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
            options: async (hashtags: string[]) => {
              if (hashtags.length > PostsValidation.MAX_HASHTAGS_PER_POST) {
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
            options: async (userIds: string[]) => {
              if (userIds.length > 0 && !userIds.every((userId) => isValidMongoId(userId))) {
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
            options: async (mediaItems: IMedia[]) => {
              const validMediaTypes = Object.values(EMediaType); // ['image', 'video', 'video-hls']
              if (
                mediaItems.length > 0 &&
                mediaItems.some((item) => typeof item.url !== 'string' || !validMediaTypes.includes(item.type))
              ) {
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

  postIdValidation = (key: string, location: Location) =>
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
              options: async (postId: string, { req }: Meta) => {
                if (!isValidMongoId(postId)) {
                  throw InvalidPostIdException;
                }

                const postDetail = await this.postsService.findPostDetail(postId);

                if (!postDetail) {
                  throw PostNotFoundException;
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

  @AutoBind()
  async audienceValidation(
    req: Request<GetPostDetailParamsDTO, object, object, Query, Record<string, unknown>>,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    const userId = req.tokenPayload?.userId;
    const post = req.postDetail as PostDetailResponseDTO;
    const ownerId = post.userId.toString();
    const isGuestUser = !userId;
    const isOwner = !isGuestUser && ownerId === userId;

    const audienceStr = post.audience as string;
    const isPublicAudience = audienceStr === EPostAudience.PUBLIC;
    const isFriendsOnlyAudience = audienceStr === EPostAudience.FRIENDS_ONLY || audienceStr === 'followers';
    const isOnlyMeAudience = audienceStr === EPostAudience.ONLY_ME || audienceStr === 'only_me';

    // kiểm tra user chưa login (guest user) thì chỉ được xem bài post có chế độ "public"
    if (isGuestUser) {
      if (!isPublicAudience) {
        throw GuestCannotAccessNonPublicPostException;
      }
      next();
      return;
    }

    if (isOwner) {
      // Chỉ cần query owner khi viewer chính là owner.
      // Kiểm tra owner của bài post có bị banned không
      const userOwner = await this.usersService.findUserById(ownerId);
      if (!userOwner) {
        throw UsersUserNotFoundException;
      }
      if (userOwner.verificationStatus === EUserVerificationStatus.BANNED) {
        throw UserIsBannedException;
      }
    }

    // kiểm tra bài post có chế độ "only me" thì chỉ user owner mới được xem bài post
    if (isOnlyMeAudience) {
      if (!isOwner) {
        throw OnlyOwnerCanViewPostsException;
      }
    }

    // friends-only — chỉ bạn bè, owner, hoặc mentions
    if (isFriendsOnlyAudience) {
      const isMention = post.mentions.some((mention) => mention.toString() === userId);
      if (!isOwner && !isMention) {
        const isFriend = await this.friendsService.isFriendOf(userId, ownerId);
        if (!isFriend) {
          throw OnlyFriendsCanViewPostsException;
        }
      }
    }

    // block hai chiều — mặc định 403; nếu viewer đã engage với post này thì cho xem và redact author.
    if (!isOwner) {
      const blocked = await this.blockRepository.isBlockedEitherWay(userId, post.userId.toString());
      if (blocked) {
        const engaged = await this.postsService.hasViewerEngagedWithPost(userId, post._id.toString());
        if (!engaged) {
          throw CannotViewPostBlockedException;
        }
        redactPostDetailBlockedAuthor(post);
      }
    }

    next();
  }

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
