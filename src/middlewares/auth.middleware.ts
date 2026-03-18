import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { AuthFailureError, ForbiddenError } from '@/responses/error.response';
import TokenService from '@/services/token.service';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Middleware to protect routes
// Checks for a JWT token in the request cookies or Authorization header
// If the token is valid, it decodes the user information and attaches it to the request object
// If the token is missing or invalid, it returns an error response
export const protect = (req: Request, _res: Response, next: NextFunction): void => {
  let token = req.cookies.accessToken;

  if (!token) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.NO_TOKEN_PROVIDED);
    }
    token = authHeader.split(' ')[1];
  }

  try {
    const tokenService = new TokenService();
    const decoded = tokenService.verifyAccessTokenSync(token);
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_HAS_EXPIRED);
    }
    throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
  }
};

// Optional auth middleware:
// - If there is no Authorization: Bearer <token> header, it skips and calls next()
// - If present, it verifies/decodes and attaches req.tokenPayload
export const protectIfHasBearerToken = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const tokenService = new TokenService();
    const decoded = tokenService.verifyAccessTokenSync(token);
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_HAS_EXPIRED);
    }
    throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
  }
};
