import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { USERNAME_REGEX } from '@/constants/regex.constant';
import { AutoBind } from '@/decorators/autoBind.decorator';
import { Injectable } from '@/decorators/injectable.decorator';
import { EUserVerificationStatus } from '@/modules/users/users.enum';
import {
  EngagementRequiresVerifiedAccountException,
  InvalidUserIdException,
  MissingAuthTokenPayloadException,
  UserIsBannedException,
  UserNotVerifiedYetException,
  UsernameAlreadyExistsException,
  UsernameFormatInvalidException,
  UsersUserNotFoundException
} from '@/modules/users/users.exception';
import { UsersService } from '@/modules/users/users.service';
import { RequestContextLogger } from '@/providers/logger/request-context.logger';
import { isValidMongoId } from '@/utils/common.util';
import { validate } from '@/utils/validation.util';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { Location, ParamSchema, checkSchema } from 'express-validator';

export const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: VALIDATION_ERROR_MESSAGE.NAME_MUST_BE_A_STRING
  },
  isLength: {
    errorMessage: VALIDATION_ERROR_MESSAGE.NAME_LENGTH_MUST_BE_FROM_1_TO_100,
    options: {
      min: 1,
      max: 100
    }
  }
};

export const dateOfBirthSchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.DATE_OF_BIRTH_IS_REQUIRED
  },
  isISO8601: {
    errorMessage: VALIDATION_ERROR_MESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601,
    options: {
      strict: true,
      strictSeparator: true
    }
  }
};

export const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: VALIDATION_ERROR_MESSAGE.IMAGE_MUST_BE_A_STRING
  },
  isLength: {
    errorMessage: VALIDATION_ERROR_MESSAGE.IMAGE_LENGTH_MUST_BE_FROM_1_TO_500,
    options: {
      min: 1,
      max: 500
    }
  },
  trim: true
};

export interface IUsersValidation {
  updateMeValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  userVerifiedValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  /** After `protect` or inside `optionalAuth` when a token exists: load `req.user` without requiring verified (still bans missing users). */
  attachAuthenticatedUserAllowUnverified: RequestHandler<
    ParamsDictionary,
    object,
    object,
    Query,
    Record<string, unknown>
  >;
  /** Use after `attachAuthenticatedUserAllowUnverified`; 403 if user is unverified (likes, bookmarks, etc.). */
  forbidUnverifiedEngagement: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  userIdValidation: (
    key: string,
    location: Location
  ) => RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

@Injectable()
export class UsersValidation implements IUsersValidation {
  constructor(private readonly usersService: UsersService) {}

  updateMeValidation = validate(
    checkSchema(
      {
        name: {
          ...nameSchema,
          optional: true,
          notEmpty: undefined
        },
        dateOfBirth: {
          ...dateOfBirthSchema,
          optional: true
        },
        bio: {
          optional: true,
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.BIO_MUST_BE_A_STRING
          },
          isLength: {
            errorMessage: VALIDATION_ERROR_MESSAGE.BIO_LENGTH_MUST_BE_FROM_1_TO_500,
            options: {
              min: 1,
              max: 500
            }
          },
          trim: true
        },
        location: {
          optional: true,
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.LOCATION_MUST_BE_A_STRING
          },
          isLength: {
            errorMessage: VALIDATION_ERROR_MESSAGE.LOCATION_LENGTH_MUST_BE_FROM_1_TO_500,
            options: {
              min: 1,
              max: 500
            }
          },
          trim: true
        },
        website: {
          optional: true,
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.WEBSITE_MUST_BE_A_STRING
          },
          isLength: {
            errorMessage: VALIDATION_ERROR_MESSAGE.WEBSITE_LENGTH_MUST_BE_FROM_1_TO_500,
            options: {
              min: 1,
              max: 500
            }
          },
          trim: true
        },
        username: {
          optional: true,
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.USERNAME_MUST_BE_A_STRING
          },
          // isLength: {
          //   errorMessage: VALIDATION_ERROR_MESSAGE.USERNAME_LENGTH_MUST_BE_FROM_1_TO_50,
          //   options: {
          //     min: 1,
          //     max: 50
          //   }
          // },
          trim: true,
          custom: {
            options: async (username: string) => {
              // check if username is valid format
              if (!USERNAME_REGEX.test(username)) {
                throw UsernameFormatInvalidException;
              }

              // check if username already exists
              const user = await this.usersService.findUserByUsername(username);

              if (user) {
                throw UsernameAlreadyExistsException;
              }

              return true;
            }
          }
        },
        avatar: imageSchema,
        coverPhoto: imageSchema
      },
      ['body']
    ),
    { assignMatchedBody: true, locations: ['body'] }
  );

  @AutoBind()
  async userVerifiedValidation(req: Request, _res: Response, next: NextFunction) {
    const userId: string | undefined = req.tokenPayload?.userId;
    if (!userId) {
      throw MissingAuthTokenPayloadException;
    }
    const user = await this.usersService.findUserById(userId); // TODO: cache by redis
    if (!user) {
      throw UsersUserNotFoundException;
    }
    if (user.verificationStatus === EUserVerificationStatus.UNVERIFIED) {
      throw UserNotVerifiedYetException;
    }
    if (user.verificationStatus === EUserVerificationStatus.BANNED) {
      throw UserIsBannedException;
    }
    req.user = user;
    RequestContextLogger.syncLogContextFromUser(req);
    next();
  }

  @AutoBind()
  async attachAuthenticatedUserAllowUnverified(req: Request, _res: Response, next: NextFunction) {
    const userId: string | undefined = req.tokenPayload?.userId;
    if (!userId) {
      throw MissingAuthTokenPayloadException;
    }
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw UsersUserNotFoundException;
    }
    if (user.verificationStatus === EUserVerificationStatus.BANNED) {
      throw UserIsBannedException;
    }
    req.user = user;
    RequestContextLogger.syncLogContextFromUser(req);
    next();
  }

  @AutoBind()
  async forbidUnverifiedEngagement(req: Request, _res: Response, next: NextFunction) {
    const user = req.user;
    if (!user) {
      throw MissingAuthTokenPayloadException;
    }
    if (user.verificationStatus === EUserVerificationStatus.UNVERIFIED) {
      throw EngagementRequiresVerifiedAccountException;
    }
    next();
  }

  @AutoBind()
  userIdValidation(key: string, location: Location) {
    return validate(
      checkSchema(
        {
          [key]: {
            notEmpty: {
              errorMessage: VALIDATION_ERROR_MESSAGE.USER_ID_IS_REQUIRED
            },
            isString: {
              errorMessage: VALIDATION_ERROR_MESSAGE.USER_ID_MUST_BE_A_STRING
            },
            trim: true,
            custom: {
              options: async (userId: string, { req }) => {
                if (!isValidMongoId(userId)) {
                  throw InvalidUserIdException;
                }

                const user = (req as Request).user;

                if (!user) {
                  const findUser = await this.usersService.findUserById(userId);

                  if (!findUser) {
                    throw UsersUserNotFoundException;
                  }

                  (req as Request).user = findUser;
                }

                return true;
              }
            }
          }
        },
        [location]
      )
    );
  }
}
