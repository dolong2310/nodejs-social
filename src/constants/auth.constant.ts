import { isProduction } from '@/config';
import type { CookieOptions } from 'express';
import jwt from 'jsonwebtoken';

/** HttpOnly cookie name for JWT refresh token (never returned in JSON). */
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

/** Thuộc tính dùng chung cho set/clear refresh cookie (clear phải khớp path/sameSite). */
export const refreshTokenCookieSharedOptions: Pick<CookieOptions, 'httpOnly' | 'secure' | 'sameSite' | 'path'> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/'
};

export function refreshTokenMaxAgeMs(token: string): number {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (decoded?.exp == null) {
    return 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  }
  return Math.max(0, decoded.exp * 1000 - Date.now()); // milliseconds remaining
}
