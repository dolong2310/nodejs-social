import { InvalidTokenException } from '@/application/exceptions/auth.exception';
import { LogoutCommand, LogoutInPort } from '@/application/use-cases/auth/logout/logout.in-port';
import { RefreshTokenRepositoryPort } from '@/domain/repositories/refresh-token/refresh-token.repository';

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
