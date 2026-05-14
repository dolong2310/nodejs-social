import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import { TokenServicePort } from '@/modules/authentication/application/services/token.service.type';
import { BaseGuard } from '@/presentation/http/express/core/base.guard';
import { extractTokenFromHeader } from '@/presentation/http/express/utils/token.util';
import { Request } from 'express';

export class AuthOptionGuard implements BaseGuard {
  constructor(private readonly tokenService: TokenServicePort) {}

  /**
   * Cho phép request không có token đi qua — set tokenPayload nếu token hợp lệ.
   * Dùng cho các route public nhưng áp dụng logic bổ sung khi đã đăng nhập.
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
      // Token không hợp lệ trên optional route => coi như guest.
      // if (error instanceof jwt.TokenExpiredError) {
      //   throw TokenHasExpiredException;
      // }
      // throw TokenInvalidException;
    }
    return true;
  }
}
