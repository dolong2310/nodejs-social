import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import { AccessTokenPayload, TokenServicePort } from '@/modules/auth/application/services/token.service.type';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { EHttpMethod, PermissionFullProps } from '@/modules/permission/domain/entities/permission.type';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/role/application/constants/cache.constant';
import { RoleQueryRepositoryPort } from '@/modules/role/application/ports/queries/role-query.repository';
import { RoleWithPermissions } from '@/modules/role/application/ports/queries/role-query.type';
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
    private readonly cacheManager: CacheManagerPort
  ) {
    super();
    // this.cacheManager.clear();
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

    let cachedRole = await this.cacheManager.get<CachedRole>(CACHE_KEYS.role(roleId));

    if (!cachedRole) {
      const rolePermissions = await this.roleQueryRepository.findRoleWithPermissionsById(roleId);

      if (!rolePermissions) {
        throw new ForbiddenException();
      }

      // Key by method and path (mục đích transform lại thành method:path để dễ dàng check canAccess bằng object)
      const permissionsMap = keyBy(rolePermissions.permissions, (p) => `${p.method}-${p.path}`);

      cachedRole = {
        ...rolePermissions,
        permissionsMap
      };

      await this.cacheManager.set(CACHE_KEYS.role(roleId), cachedRole, CACHE_TTL.ROLE);
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
