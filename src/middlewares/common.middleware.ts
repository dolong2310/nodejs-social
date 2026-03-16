import HTTP_STATUS from '@/constants/httpStatus.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ETokenType } from '@/enums/token.enum';
import { EUserVerificationStatus } from '@/enums/users.enum';
import { ErrorWithStatus } from '@/models/error.model';
import { IUser } from '@/models/schemas/user.schema';
import tokenService from '@/services/token.service';
import usersService from '@/services/users.service';
import { AccessTokenPayload } from '@/types/token.type';
import { NextFunction, Request, Response } from 'express';
import { pick } from 'lodash-es';

export const filterBodyMiddleware =
  <T>(filterKeys: (keyof T)[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys as string[]);
    next();
  };

export const verifyAuthorizationMiddleware = async (token?: string): Promise<AccessTokenPayload> => {
  if (!token) {
    throw new ErrorWithStatus({
      message: VALIDATION_ERROR_MESSAGE.AUTHORIZATION_IS_REQUIRED,
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }

  // decode token
  const decoded = await tokenService.verifyAccessToken(token);
  if (decoded.type !== ETokenType.ACCESS_TOKEN) {
    throw new ErrorWithStatus({
      message: VALIDATION_ERROR_MESSAGE.AUTHORIZATION_IS_INVALID,
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }

  return decoded;
};

export const verifyUserMiddleware = async (userId: string): Promise<IUser> => {
  const user = await usersService.findUserById(userId); // TODO: cache by redis
  if (!user) {
    throw new ErrorWithStatus({
      message: VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    });
  }
  if (user.verificationStatus === EUserVerificationStatus.UNVERIFIED) {
    throw new ErrorWithStatus({
      message: VALIDATION_ERROR_MESSAGE.USER_NOT_VERIFIED_YET,
      status: HTTP_STATUS.FORBIDDEN
    });
  }
  if (user.verificationStatus === EUserVerificationStatus.BANNED) {
    throw new ErrorWithStatus({
      message: VALIDATION_ERROR_MESSAGE.USER_IS_BANNED,
      status: HTTP_STATUS.FORBIDDEN
    });
  }
  return user;
};
