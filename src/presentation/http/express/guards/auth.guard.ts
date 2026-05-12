import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import { AccessTokenPayload, TokenServicePort } from '@/modules/authentication/application/services/token.service.type';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/authorization/application/constants/cache.constant';
import { EHttpMethod, PermissionFullProps } from '@/modules/authorization/domain/entities/permission.type';
import { RoleQueryRepositoryPort } from '@/modules/authorization/domain/repositories/role.query.repository';
import { RoleWithPermissions } from '@/modules/authorization/domain/repositories/role.query.type';
import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import {
  NoTokenProvidedException,
  TokenHasExpiredException
} from '@/presentation/http/express/exceptions/auth.exception';
import { TokenInvalidException } from '@/presentation/http/express/exceptions/token.exception';
import { BaseGuard } from '@/presentation/http/express/guards/base.guard';
import { ForbiddenException, UnauthorizedException } from '@/presentation/http/express/responses/error.response';
import { extractTokenFromHeader } from '@/presentation/http/express/utils/token.util';
import { resolveUrlPath } from '@/presentation/http/express/utils/url.util';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { keyBy, omit } from 'lodash-es';
import { Dictionary, Prettify } from 'ts-essentials';

type CachedRole = Prettify<RoleWithPermissions & { permissionsMap: Dictionary<PermissionFullProps> }>;

export class AuthGuard extends BaseGuard {
  constructor(
    private readonly roleQueryRepository: RoleQueryRepositoryPort,
    private readonly tokenService: TokenServicePort,
    private readonly cache: CacheStrategyPort
  ) {
    super();
  }

  protected override async canActivate(request: Request): Promise<boolean> {
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
      if (error instanceof jwt.JsonWebTokenError) {
        throw TokenInvalidException;
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw TokenHasExpiredException;
      }
      throw error;
    }
  }

  private async verifyRole(request: Request, decoded: AccessTokenPayload): Promise<void> {
    const method = request.method as EHttpMethod;
    const path = resolveUrlPath({
      path: request.route.path,
      baseUrl: request.baseUrl,
      params: request.params,
      originalUrl: request.originalUrl
    });
    const roleId = decoded.roleId;

    const cachedRole = await this.cache.get<CachedRole>(
      CACHE_KEYS.role(roleId),
      async () => {
        const rolePermissions = await this.roleQueryRepository.findRoleWithPermissionsById(roleId);

        if (!rolePermissions) {
          return null;
        }

        // Key by method and path (mục đích transform lại thành method:path để dễ dàng check canAccess bằng object)
        const permissionsMap = keyBy(rolePermissions.permissions, (p) => `${p.method}-${p.path}`);

        return {
          ...rolePermissions,
          permissionsMap
        };
      },
      { ttlSeconds: CACHE_TTL.ROLE }
    );

    if (!cachedRole) {
      throw new ForbiddenException();
    }

    // Check if user is active and has permission to access the route
    const canAccess = cachedRole?.isActive && !!cachedRole?.permissionsMap[`${method}-${path}`];
    // console.log('canAccess: ', Boolean(canAccess));

    if (!canAccess) {
      throw new ForbiddenException();
    }

    // Set roleWithPermissions to request
    const roleWithPermissions = omit(cachedRole, ['permissionsMap']);

    request.role = roleWithPermissions;
  }
}
