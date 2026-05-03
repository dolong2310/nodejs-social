import { TokenServicePort } from '@/modules/auth/application/services/token.service.type';
import { RefreshTokenRepositoryPort } from '@/modules/auth/domain/repositories/refresh-token.repository';

export interface AuthServicePort {
  createAuthSession(
    data: {
      userId: string;
      roleId: string;
      roleName: string;
    },
    options?: { isCreateInDatabase?: boolean }
  ): Promise<{ accessToken: string; refreshToken: string }>;
}

export class AuthService implements AuthServicePort {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    private readonly tokenService: TokenServicePort
  ) {}

  async createAuthSession(
    data: {
      userId: string;
      roleId: string;
      roleName: string;
    },
    options?: { isCreateInDatabase?: boolean }
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId, roleId, roleName } = data;
    const { isCreateInDatabase = false } = options || {};

    // 1. generate tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({ userId, roleId, roleName }),
      this.tokenService.signRefreshToken({ userId })
    ]);

    if (isCreateInDatabase) {
      // 2. verify refresh token
      const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken);
      const expiresAt = new Date(decodedRefreshToken.exp * 1000);

      // 3. Save refresh token to database
      await this.refreshTokenRepository.createRefreshToken({ userId, token: refreshToken, expiresAt });
    }

    // 4. Return tokens
    return { accessToken, refreshToken };
  }
}
