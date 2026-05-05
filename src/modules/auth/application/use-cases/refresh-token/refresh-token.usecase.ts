import { InvalidTokenException } from '@/modules/auth/application/auth.exception';
import { RefreshTokenExpiredException } from '@/modules/auth/application/refresh-token.exception';
import { AuthServicePort } from '@/modules/auth/application/services/auth.service';
import { TokenServicePort } from '@/modules/auth/application/services/token.service.type';
import {
  RefreshTokenCommand,
  RefreshTokenPort,
  RefreshTokenResult
} from '@/modules/auth/application/use-cases/refresh-token/refresh-token.port';
import { RefreshTokenRepositoryPort } from '@/modules/auth/domain/repositories/refresh-token.repository';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { RoleNotFoundException } from '@/modules/role/application/role.exception';
import { UserQueryRepositoryPort } from '@/modules/user/application/ports/queries/user-query.repository';
import { UserNotFoundException } from '@/modules/user/application/user.exception';
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
