import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import {
  ExpiredTokenException,
  InvalidTokenException
} from '@/modules/authentication/application/exceptions/auth.exception';
import type { AccessTokenPayload, TokenServicePort } from '@/modules/authentication/application/ports/token.port';
import type { CheckRouteAccessPort } from '@/modules/authorization/application/use-cases/check-route-access/check-route-access.port';
import type { EnumHttpMethod } from '@/modules/authorization/domain/entities/permission.types';
import type { BaseGuard } from '@/presentation/http/express/core/base.guard';
import {
  NoTokenProvidedException,
  TokenHasExpiredException
} from '@/presentation/http/express/exceptions/auth.exception';
import { TokenInvalidException } from '@/presentation/http/express/exceptions/token.exception';
import { ForbiddenException, UnauthorizedException } from '@/presentation/http/express/responses/error.response';
import { extractTokenFromHeader } from '@/presentation/http/express/utils/token.util';
import { resolveUrlPath } from '@/presentation/http/express/utils/url.util';
import type { Request } from 'express';

export class AuthGuard implements BaseGuard {
  constructor(
    private readonly checkRouteAccessUC: CheckRouteAccessPort,
    private readonly tokenService: TokenServicePort
  ) {}

  async canActivate(request: Request): Promise<boolean> {
    const decoded = await this.verifyToken(request);
    await this.verifyRole(request, decoded);
    requestContextLogger.syncLogContextFromAuth(request);
    return true;
  }

  private async verifyToken(request: Request): Promise<AccessTokenPayload> {
    const token = extractTokenFromHeader(request);
    if (!token) {
      throw NoTokenProvidedException;
    }

    try {
      const decoded = await this.tokenService.verifyAccessToken(token);

      if (!decoded) {
        throw new UnauthorizedException();
      }

      request.tokenPayload = decoded;

      return decoded;
    } catch (error) {
      if (error instanceof ExpiredTokenException) {
        throw TokenHasExpiredException;
      }
      if (error instanceof InvalidTokenException) {
        throw TokenInvalidException;
      }
      throw error;
    }
  }

  private async verifyRole(request: Request, decoded: AccessTokenPayload): Promise<void> {
    const role = await this.checkRouteAccessUC.execute({
      roleId: decoded.roleId,
      method: request.method as EnumHttpMethod,
      // The permission path is the route pattern (e.g. /api/v1/users/:id), not the concrete URL.
      path: resolveUrlPath({
        path: request.route.path,
        baseUrl: request.baseUrl,
        params: request.params,
        originalUrl: request.originalUrl
      })
    });

    if (!role) {
      throw new ForbiddenException();
    }

    request.role = role;
  }
}
