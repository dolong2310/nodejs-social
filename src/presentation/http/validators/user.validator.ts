import { IUserService } from '@/application/services/user/user.service';
import { EUserStatus } from '@/domain/entities/user/user.type';
import { isValidId } from '@/domain/helpers/ids';
import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/constants/message.constant';
import { USERNAME_REGEX } from '@/presentation/http/constants/regex.constant';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import {
  InvalidUserIdException,
  MissingAuthTokenPayloadException,
  UserIsBannedException,
  UserIsInactiveException,
  UserNotFoundException,
  UsernameAlreadyExistsException,
  UsernameFormatInvalidException
} from '@/presentation/http/exceptions/user.exception';
import { validate } from '@/presentation/http/utils/validation.util';
import { confirmPasswordSchema, passwordSchema } from '@/presentation/http/validators/auth.validator';
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

export const birthdaySchema: ParamSchema = {
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

export interface IUserValidator {
  updateMeValidator: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  userVerifiedValidator: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  attachAuthenticatedUserAllowUnverified: RequestHandler<
    ParamsDictionary,
    object,
    object,
    Query,
    Record<string, unknown>
  >;
  /** Use after `attachAuthenticatedUserAllowUnverified`; 403 if user is unverified (likes, bookmarks, etc.). */
  forbidUnverifiedEngagement: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  userIdValidator: (
    key: string,
    location: Location
  ) => RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  changePasswordValidator: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

export class UsersValidator implements IUserValidator {
  constructor(private readonly userService: IUserService) {}

  updateMeValidator = validate(
    checkSchema(
      {
        name: {
          ...nameSchema,
          optional: true,
          notEmpty: undefined
        },
        birthday: {
          ...birthdaySchema,
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
            options: async (username: string, { req }) => {
              // check if username is valid format
              if (!USERNAME_REGEX.test(username)) {
                throw UsernameFormatInvalidException;
              }

              // nếu username gửi lên trùng username hiện tại của user thì skip, tránh query DB không cần thiết
              const authenticatedUser = (req as Request).user;
              if (authenticatedUser?.username === username) {
                return true;
              }

              // check if username already exists
              const user = await this.userService.findUserByUsername(username);

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
  async userVerifiedValidator(req: Request, _res: Response, next: NextFunction) {
    const userId: string | undefined = req.tokenPayload?.userId;
    if (!userId) {
      throw MissingAuthTokenPayloadException;
    }
    const user = await this.userService.findUserById(userId); // TODO: cache by redis
    if (!user) {
      throw UserNotFoundException;
    }
    if (user.status === EUserStatus.INACTIVE) {
      throw UserIsInactiveException;
    }
    if (user.status === EUserStatus.BANNED) {
      throw UserIsBannedException;
    }
    req.user = user;
    requestContextLogger.syncLogContextFromUser(req);
    next();
  }

  @AutoBind()
  async attachAuthenticatedUserAllowUnverified(req: Request, _res: Response, next: NextFunction) {
    const userId: string | undefined = req.tokenPayload?.userId;
    if (!userId) {
      throw MissingAuthTokenPayloadException;
    }
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw UserNotFoundException;
    }
    if (user.status === EUserStatus.BANNED) {
      throw UserIsBannedException;
    }
    req.user = user;
    requestContextLogger.syncLogContextFromUser(req);
    next();
  }

  @AutoBind()
  async forbidUnverifiedEngagement(req: Request, _res: Response, next: NextFunction) {
    const user = req.user;
    if (!user) {
      throw MissingAuthTokenPayloadException;
    }
    if (user.status === EUserStatus.INACTIVE) {
      throw UserIsInactiveException;
    }
    next();
  }

  @AutoBind()
  userIdValidator(key: string, location: Location) {
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
                if (!isValidId(userId)) {
                  throw InvalidUserIdException;
                }

                const user = (req as Request).user;

                if (!user) {
                  const findUser = await this.userService.findUserById(userId);

                  if (!findUser) {
                    throw UserNotFoundException;
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

  changePasswordValidator = validate(
    checkSchema(
      {
        password: passwordSchema,
        confirmPassword: confirmPasswordSchema
      },
      ['body']
    )
  );
}
