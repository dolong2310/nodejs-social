import { InvalidTokenException } from '@/application/exceptions/auth.exception';
import { RefreshTokenExpiredException } from '@/application/exceptions/refresh-token.exception';
import { RoleNotFoundException } from '@/application/exceptions/role.exception';
import { UserNotFoundException } from '@/application/exceptions/user.exception';
import { UserQueryRepositoryPort } from '@/application/queries/user/user-query.repository';
import { IAuthService } from '@/application/services/auth/auth.service';
import { ITokenService } from '@/application/services/token/token.service.type';
import { IUserService } from '@/application/services/user/user.service';
import {
  RefreshTokenCommand,
  RefreshTokenInPort,
  RefreshTokenResult
} from '@/application/use-cases/auth/refresh-token/refresh-token.in-port';
import { ERoleName } from '@/domain/entities/role/role.type';
import { invariant } from '@/domain/helpers/invariant';
import { RefreshTokenRepositoryPort } from '@/domain/repositories/refresh-token/refresh-token.repository';
import { RoleRepositoryPort } from '@/domain/repositories/role/role.repository';
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

      // // 2. Get user role id
      // const user = await this.userService.findUserById(decoded.userId);

      // if (!user) {
      //   throw UserNotFoundException;
      // }

      // // 3. get role name
      // const roleEntity = await this.roleRepository.findRoleById(user.roleId);

      // if (!roleEntity) {
      //   throw RoleNotFoundException;
      // }

      // 4. Generate new tokens
      const { accessToken, refreshToken } = await this.authService.createAuthSession({
        userId: decoded.userId,
        roleId: user.roleId,
        roleName: user.role.name as ERoleName
      });

      // 5. Rotate refresh token
      const rotated = await this.refreshTokenRepository.rotateRefreshToken({
        userId: decoded.userId,
        oldToken: command.refreshToken,
        newToken: refreshToken
      });

      if (!rotated) {
        throw InvalidTokenException;
      }

      // 6. Return tokens
      return new RefreshTokenResult({ accessToken, refreshToken });
    } catch (error) {
      invariant(error instanceof jwt.TokenExpiredError, RefreshTokenExpiredException); // TODO: kiểm tra type sau khi invariant
      invariant(error instanceof jwt.JsonWebTokenError, InvalidTokenException);
      // RefreshTokenHasBeenRevokedException

      throw error;
    }
  }
}
