import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ETokenType } from '@/enums/token.enum';
import { EUserVerificationStatus } from '@/enums/users.enum';
import { AuthFailureError, ForbiddenError, NotFoundError } from '@/models/error.response';
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
    throw new AuthFailureError();
  }

  // decode token
  const decoded = await tokenService.verifyAccessToken(token);
  if (decoded.type !== ETokenType.ACCESS_TOKEN) {
    throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.ACCESS_TOKEN_IS_INVALID);
  }

  return decoded;
};

export const verifyUserMiddleware = async (userId: string): Promise<IUser> => {
  const user = await usersService.findUserById(userId); // TODO: cache by redis
  if (!user) {
    throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
  }
  if (user.verificationStatus === EUserVerificationStatus.UNVERIFIED) {
    throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_NOT_VERIFIED_YET);
  }
  if (user.verificationStatus === EUserVerificationStatus.BANNED) {
    throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_IS_BANNED);
  }
  return user;
};
