import {
  type DeleteExpiredRefreshTokensInputPort,
  DeleteExpiredRefreshTokensPort,
  DeleteExpiredRefreshTokensOutputPort
} from '@/modules/authentication/application/use-cases/delete-expired-refresh-tokens/delete-expired-refresh-tokens.port';
import type { RefreshTokenRepositoryPort } from '@/modules/authentication/domain/repositories/refresh-token.repository';

export class DeleteExpiredRefreshTokensUseCase extends DeleteExpiredRefreshTokensPort {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepositoryPort) {
    super();
  }

  async execute(input: DeleteExpiredRefreshTokensInputPort): Promise<DeleteExpiredRefreshTokensOutputPort> {
    const deletedCount = await this.refreshTokenRepository.deleteExpiredRefreshTokens(input.now);
    return new DeleteExpiredRefreshTokensOutputPort({ deletedCount });
  }
}
