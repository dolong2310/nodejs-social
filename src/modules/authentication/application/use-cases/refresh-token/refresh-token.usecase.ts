import { InvalidTokenException } from '@/modules/authentication/application/exceptions/auth.exception';
import { RefreshTokenExpiredException } from '@/modules/authentication/application/exceptions/refresh-token.exception';
import { AuthServicePort } from '@/modules/authentication/application/services/auth.service';
import { TokenServicePort } from '@/modules/authentication/application/services/token.service.type';
import {
  RefreshTokenCommand,
  RefreshTokenPort,
  RefreshTokenResult
} from '@/modules/authentication/application/use-cases/refresh-token/refresh-token.port';
import { RefreshTokenRepositoryPort } from '@/modules/authentication/domain/repositories/refresh-token.repository';
import { RoleNotFoundException } from '@/modules/authorization/application/exceptions/role.exception';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import jwt from 'jsonwebtoken';

export class RefreshTokenUseCase extends RefreshTokenPort {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    private readonly userQueryRepository: UserQueryRepositoryPort,
    private readonly authService: AuthServicePort,
    private readonly tokenService: TokenServicePort
  ) {
    super();
  }

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    try {
      // 1. Check valid refresh token + Decode refresh token get user id
      const decoded = await this.tokenService.verifyRefreshToken(command.refreshToken); // nếu error thì chạy ở catch

      const user = await this.userQueryRepository.findUserByIdIncludeRole(decoded.userId);

      if (!user) {
        throw new UserNotFoundException();
      }

      if (!user.role) {
        throw new RoleNotFoundException();
      }

      // 2. Generate new tokens
      const { accessToken, refreshToken } = await this.authService.createAuthSession({
        userId: decoded.userId,
        roleId: user.roleId,
        roleName: user.role.name
      });

      // 3. Rotate refresh token
      const rotated = await this.refreshTokenRepository.rotateRefreshToken({
        userId: decoded.userId,
        oldToken: command.refreshToken,
        newToken: refreshToken
      });

      if (!rotated) {
        throw new InvalidTokenException();
      }

      // 4. Return tokens
      return new RefreshTokenResult({ accessToken, refreshToken });
    } catch (error) {
      invariant(error instanceof jwt.TokenExpiredError, new RefreshTokenExpiredException());
      invariant(error instanceof jwt.JsonWebTokenError, new InvalidTokenException());
      // RefreshTokenHasBeenRevokedException

      throw error;
    }
  }
}
