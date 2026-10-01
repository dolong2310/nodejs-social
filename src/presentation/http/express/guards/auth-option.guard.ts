import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import type { TokenServicePort } from '@/modules/authentication/application/services/token.service.types';
import type { BaseGuard } from '@/presentation/http/express/core/base.guard';
import { extractTokenFromHeader } from '@/presentation/http/express/utils/token.util';
import type { Request } from 'express';

export class AuthOptionGuard implements BaseGuard {
  constructor(private readonly tokenService: TokenServicePort) {}

  /**
   * Allow requests without a token to pass through, and set tokenPayload when the token is valid.
   * Used for public routes that apply extra logic when the user is authenticated.
   */
  async canActivate(request: Request): Promise<boolean> {
    const token = extractTokenFromHeader(request);
    if (!token) {
      return true;
    }

    try {
      request.tokenPayload = await this.tokenService.verifyAccessToken(token);
      requestContextLogger.syncLogContextFromAuth(request);
    } catch {
      // Invalid token on an optional route => treat as guest.
      // if (error instanceof jwt.TokenExpiredError) {
      //   throw TokenHasExpiredException;
      // }
      // throw TokenInvalidException;
    }
    return true;
  }
}
