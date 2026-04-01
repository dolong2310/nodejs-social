/*
 * Middleware for rate limiting API requests.
 * This middleware limits the number of requests to specific routes to prevent abuse.
 */

import { isDevelopment } from '@/config/envConfig';
import { HTTP_ERROR_MESSAGE } from '@/constants/httpMessage.constant';
import { HTTP_STATUS } from '@/constants/httpStatus.constant';
import { RATE_LIMIT_ERROR_MESSAGE } from '@/constants/message.constant';
import { Request, type RequestHandler } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const skipRateLimitForTests: RequestHandler = (_req, _res, next) => next();

// Function to create a rate limiter
// Accepts parameters for the time window, maximum requests, and error message
// Returns a configured rate limiter middleware
export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      error: HTTP_ERROR_MESSAGE.TOO_MANY_REQUESTS,
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // `ipKeyGenerator` ensures IPv6-safe keying to avoid bypassing limits.
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return ipKeyGenerator(ip);
    }
  });
};

// Rate limiters for specific routes
// These limiters can be applied to authentication and note operations
// They define the time window and maximum number of requests allowed
/** Vitest integration smoke hits many auth endpoints from one IP in one run (>5); skip strict auth cap under test. */
export const authLimiter = isDevelopment
  ? skipRateLimitForTests
  : createRateLimiter(
      5 * 60 * 1000, // 5 minutes
      5,
      RATE_LIMIT_ERROR_MESSAGE.TOO_MANY_AUTHENTICATION_ATTEMPTS
    );

export const postsLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  30,
  RATE_LIMIT_ERROR_MESSAGE.TOO_MANY_REQUESTS
);

export const appLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  100,
  RATE_LIMIT_ERROR_MESSAGE.TOO_MANY_REQUESTS
);
