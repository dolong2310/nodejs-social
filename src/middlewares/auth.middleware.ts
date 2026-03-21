import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { Container } from '@/container';
import { syncLogContextFromAuth } from '@/logger/request-context';
import { AuthFailureError, ForbiddenError } from '@/responses/error.response';
import { TokenPayload } from '@/types/token.type';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import jwt from 'jsonwebtoken';

export const protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  let token = req.cookies.accessToken;

  if (!token) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next(new ForbiddenError(VALIDATION_ERROR_MESSAGE.NO_TOKEN_PROVIDED));
      return;
    }
    token = authHeader.split(' ')[1];
  }

  try {
    req.tokenPayload = await _verifyAccessToken(token);
    syncLogContextFromAuth(req);
    next();
  } catch (error) {
    next(_mapJwtVerifyError(error));
  }
};

export const protectIfHasBearerToken = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    req.tokenPayload = await _verifyAccessToken(token);
    syncLogContextFromAuth(req);
    next();
  } catch (error) {
    next(_mapJwtVerifyError(error));
  }
};

export const optionalAuth = (
  handler: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>
): RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      req.tokenPayload = await _verifyAccessToken(token);
      syncLogContextFromAuth(req);
    } catch (error) {
      next(_mapJwtVerifyError(error));
      return;
    }

    try {
      handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

const _verifyAccessToken = async (token: string): Promise<TokenPayload> => {
  try {
    const tokenService = Container.get().getTokenService();
    return await tokenService.verifyAccessToken(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_HAS_EXPIRED);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
    }
    throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
  }
};

const _mapJwtVerifyError = (error: unknown): Error => {
  if (error instanceof AuthFailureError) {
    return error;
  }
  if (error instanceof jwt.TokenExpiredError) {
    return new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_HAS_EXPIRED);
  }
  return new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
};
