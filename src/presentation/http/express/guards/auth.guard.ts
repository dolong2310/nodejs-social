import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import { TokenServicePort } from '@/modules/auth/application/services/token.service.type';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';
import {
  NoTokenProvidedException,
  TokenHasExpiredException
} from '@/presentation/http/express/exceptions/auth.exception';
import { RoleIsInactiveException } from '@/presentation/http/express/exceptions/role.exception';
import { TokenInvalidException } from '@/presentation/http/express/exceptions/token.exception';
import { BaseGuard } from '@/presentation/http/express/guards/base.guard';
import { AuthFailureError } from '@/presentation/http/express/responses/error.response';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

export class AuthGuard extends BaseGuard {
  constructor(
    private readonly roleRepository: RoleRepositoryPort,
    private readonly tokenService: TokenServicePort
  ) {
    super();
  }

  protected override async canActivate(request: Request): Promise<boolean> {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw NoTokenProvidedException;
    }
    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.tokenService.verifyAccessToken(token);

      const roleEntity = await this.roleRepository.findRoleById(payload.roleId); // TODO: cached by Redis
      if (!roleEntity || !roleEntity.getProps().isActive) {
        throw RoleIsInactiveException;
      }

      request.tokenPayload = payload;
      requestContextLogger.syncLogContextFromAuth(request);

      return true;
    } catch (error) {
      if (error instanceof AuthFailureError) {
        throw error;
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw TokenHasExpiredException;
      }
      throw TokenInvalidException;
    }
  }
}
