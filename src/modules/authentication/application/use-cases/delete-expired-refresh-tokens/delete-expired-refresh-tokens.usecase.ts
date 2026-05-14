import {
  DeleteExpiredRefreshTokensCommand,
  DeleteExpiredRefreshTokensPort,
  DeleteExpiredRefreshTokensResult
} from '@/modules/authentication/application/use-cases/delete-expired-refresh-tokens/delete-expired-refresh-tokens.port';
import { RefreshTokenRepositoryPort } from '@/modules/authentication/domain/repositories/refresh-token.repository';

export class DeleteExpiredRefreshTokensUseCase extends DeleteExpiredRefreshTokensPort {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepositoryPort) {
    super();
  }

  async execute(command: DeleteExpiredRefreshTokensCommand): Promise<DeleteExpiredRefreshTokensResult> {
    const deletedCount = await this.refreshTokenRepository.deleteExpiredRefreshTokens(command.now);
    return new DeleteExpiredRefreshTokensResult({ deletedCount });
  }
}
