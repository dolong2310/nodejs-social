import { TokenPayload } from '@/interfaces';
import { InvalidTokenAuthFailureException, NoTokenProvidedException, TokenHasExpiredException } from '@/modules';
import { AuthFailureError, Container, RequestContextLogger } from '@/providers';
import { TokenService } from '@/shared';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import jwt from 'jsonwebtoken';

const { syncLogContextFromAuth } = RequestContextLogger;

export const protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  let token = req.cookies.accessToken;

  if (!token) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next(NoTokenProvidedException);
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

/**
 * Like `protect` (cookie or Bearer) but allows unauthenticated requests — sets `tokenPayload` when a valid token is present.
 * Used for routes that are public but apply extra rules when the viewer is logged in (e.g. profile + block list).
 */
export const optionalProtect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  let token = req.cookies.accessToken;

  if (!token) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }
    token = authHeader.split(' ')[1];
  }

  try {
    req.tokenPayload = await _verifyAccessToken(token);
    syncLogContextFromAuth(req);
  } catch {
    // Invalid/expired token on an optional-auth route: treat as guest (no tokenPayload).
  }
  next();
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
    const container = Container.get();
    const tokenService = container.get(TokenService);
    return await tokenService.verifyAccessToken(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw TokenHasExpiredException;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw InvalidTokenAuthFailureException;
    }
    throw InvalidTokenAuthFailureException;
  }
};

const _mapJwtVerifyError = (error: unknown): Error => {
  if (error instanceof AuthFailureError) {
    return error;
  }
  if (error instanceof jwt.TokenExpiredError) {
    return TokenHasExpiredException;
  }
  return InvalidTokenAuthFailureException;
};
