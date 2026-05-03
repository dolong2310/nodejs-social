import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import { TokenServicePort } from '@/modules/auth/application/services/token.service.type';
import { BaseGuard } from '@/presentation/http/express/guards/base.guard';
import { Request } from 'express';

export class AuthOptionGuard extends BaseGuard {
  constructor(private readonly tokenService: TokenServicePort) {
    super();
  }

  /**
   * Cho phép request không có token đi qua — set tokenPayload nếu token hợp lệ.
   * Dùng cho các route public nhưng áp dụng logic bổ sung khi đã đăng nhập.
   */
  protected override async canActivate(request: Request): Promise<boolean> {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true;
    }
    const token = authHeader.split(' ')[1];

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
