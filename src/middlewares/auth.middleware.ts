import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { AuthFailureError, ForbiddenError } from '@/responses/error.response';
import TokenService from '@/services/token.service';
import { TokenPayload } from '@/types/token.type';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ParamsDictionary, Query } from 'express-serve-static-core';

const tokenService = new TokenService();

export const protect = (req: Request, _res: Response, next: NextFunction): void => {
  let token = req.cookies.accessToken;

  if (!token) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.NO_TOKEN_PROVIDED);
    }
    token = authHeader.split(' ')[1];
  }

  req.tokenPayload = _verifyAccessToken(token);
  next();
};

// Optional auth middleware — skips if no Bearer token present
export const protectIfHasBearerToken = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  req.tokenPayload = _verifyAccessToken(token);
  next();
};

export const optionalAuth = (
  handler: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>
): RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>> => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    req.tokenPayload = _verifyAccessToken(token);
    handler(req, _res, next);
  };
};

const _verifyAccessToken = (token: string): TokenPayload => {
  try {
    return tokenService.verifyAccessTokenSync(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_HAS_EXPIRED);
    }
    throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
  }
};
