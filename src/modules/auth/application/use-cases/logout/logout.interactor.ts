import { RefreshTokenRepositoryPort } from '@/modules/auth/domain/repositories/refresh-token.repository';
import { InvalidTokenException } from '@/modules/auth/application/auth.exception';
import { LogoutCommand, LogoutInPort } from '@/modules/auth/application/use-cases/logout/logout.in-port';

export class LogoutInteractor extends LogoutInPort {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepositoryPort) {
    super();
  }

  async execute({ refreshToken }: LogoutCommand): Promise<boolean> {
    const refreshTokenEntity = await this.refreshTokenRepository.findRefreshToken(refreshToken);

    if (!refreshTokenEntity) {
      return true; // refresh token not found, so it's already logged out
    }

    const deleted = await this.refreshTokenRepository.deleteRefreshToken(refreshToken);

    if (!deleted) {
      throw InvalidTokenException;
    }

    return true;
  }
}
