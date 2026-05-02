import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import { AccessTokenPayload, ITokenService } from '@/modules/auth/application/services/token.service.type';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';
import {
  NoTokenProvidedException,
  TokenHasExpiredException
} from '@/presentation/http/express/exceptions/auth.exception';
import { RoleIsInactiveException } from '@/presentation/http/express/exceptions/role.exception';
import { TokenInvalidException } from '@/presentation/http/express/exceptions/token.exception';
import { AuthFailureError } from '@/presentation/http/express/responses/error.response';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import jwt from 'jsonwebtoken';

export class AuthGuard {
  constructor(
    private readonly roleRepository: RoleRepositoryPort,
    private readonly tokenService: ITokenService
  ) {}

  protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
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
      const payload = await this._verifyAccessToken(token);

      const role = await this.roleRepository.findRoleById(payload.roleId); // TODO: cached by Redis
      if (!role || !role.getProps().isActive) {
        next(RoleIsInactiveException);
        return;
      }

      req.tokenPayload = payload;
      requestContextLogger.syncLogContextFromAuth(req);
      next();
    } catch (error) {
      next(this._mapJwtVerifyError(error));
    }
  };

  /**
   * Cho phép request không có token đi qua — set tokenPayload nếu token hợp lệ.
   * Dùng cho các route public nhưng áp dụng logic bổ sung khi đã đăng nhập.
   */
  optionalProtect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
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
      req.tokenPayload = await this._verifyAccessToken(token);
      requestContextLogger.syncLogContextFromAuth(req);
    } catch {
      // Token không hợp lệ trên optional route => coi như guest.
    }
    next();
  };

  protectIfHasBearerToken = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      req.tokenPayload = await this._verifyAccessToken(token);
      requestContextLogger.syncLogContextFromAuth(req);
      next();
    } catch (error) {
      next(this._mapJwtVerifyError(error));
    }
  };

  optionalAuth = (
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
        req.tokenPayload = await this._verifyAccessToken(token);
        requestContextLogger.syncLogContextFromAuth(req);
      } catch (error) {
        next(this._mapJwtVerifyError(error));
        return;
      }

      try {
        await Promise.resolve(handler(req, res, next));
      } catch (error) {
        next(error);
      }
    };
  };

  private _verifyAccessToken = async (token: string): Promise<AccessTokenPayload> => {
    try {
      return await this.tokenService.verifyAccessToken(token);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw TokenHasExpiredException;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw TokenInvalidException;
      }
      throw TokenInvalidException;
    }
  };

  private _mapJwtVerifyError = (error: unknown): Error => {
    if (error instanceof AuthFailureError) {
      return error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      return TokenHasExpiredException;
    }
    return TokenInvalidException;
  };
}
