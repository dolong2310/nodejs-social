import { ITokenService } from '@/modules/auth/application/services/token.service.type';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { RefreshTokenExpiredException } from '@/modules/auth/application/refresh-token.exception';
import { RefreshTokenRepositoryPort } from '@/modules/auth/domain/repositories/refresh-token.repository';
import { RoleNotFoundException } from '@/modules/role/application/role.exception';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';
import { InvalidTokenException } from '@/modules/auth/application/auth.exception';
import { UserQueryRepositoryPort } from '@/modules/user/application/ports/queries/user-query.repository';
import { IAuthService } from '@/modules/auth/application/services/auth.service';
import { IUserService } from '@/modules/user/application/services/user.service';
import {
  RefreshTokenCommand,
  RefreshTokenInPort,
  RefreshTokenResult
} from '@/modules/auth/application/use-cases/refresh-token/refresh-token.in-port';
import { UserNotFoundException } from '@/modules/user/application/user.exception';
import jwt from 'jsonwebtoken';

export class RefreshTokenInteractor extends RefreshTokenInPort {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    private readonly userQueryRepository: UserQueryRepositoryPort,
    private readonly roleRepository: RoleRepositoryPort,
    private readonly userService: IUserService,
    private readonly authService: IAuthService,
    private readonly tokenService: ITokenService
  ) {
    super();
  }

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    try {
      // 1. Check valid refresh token + Decode refresh token get user id
      const decoded = await this.tokenService.verifyRefreshToken(command.refreshToken); // nếu error thì chạy ở catch

      const user = await this.userQueryRepository.findUserByIdIncludeRole(decoded.userId);

      if (!user) {
        throw UserNotFoundException;
      }

      if (!user.role) {
        throw RoleNotFoundException;
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
        throw InvalidTokenException;
      }

      // 4. Return tokens
      return new RefreshTokenResult({ accessToken, refreshToken });
    } catch (error) {
      invariant(error instanceof jwt.TokenExpiredError, RefreshTokenExpiredException); // TODO: kiểm tra type sau khi invariant
      invariant(error instanceof jwt.JsonWebTokenError, InvalidTokenException);
      // RefreshTokenHasBeenRevokedException

      throw error;
    }
  }
}
