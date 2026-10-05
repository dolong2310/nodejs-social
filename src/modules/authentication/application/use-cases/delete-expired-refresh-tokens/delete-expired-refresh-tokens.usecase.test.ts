import { DeleteExpiredRefreshTokensInputPort } from '@/modules/authentication/application/use-cases/delete-expired-refresh-tokens/delete-expired-refresh-tokens.port';
import { DeleteExpiredRefreshTokensUseCase } from '@/modules/authentication/application/use-cases/delete-expired-refresh-tokens/delete-expired-refresh-tokens.usecase';
import type { RefreshTokenRepositoryPort } from '@/modules/authentication/domain/repositories/refresh-token.repository';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

describe('DeleteExpiredRefreshTokensUseCase', () => {
  it('deletes expired refresh tokens at the requested time', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const refreshTokenRepository = mockPort<RefreshTokenRepositoryPort>({
      deleteExpiredRefreshTokens: vi.fn().mockResolvedValue(2)
    });
    const useCase = new DeleteExpiredRefreshTokensUseCase(refreshTokenRepository);

    const result = await useCase.execute(new DeleteExpiredRefreshTokensInputPort({ now }));

    expect(refreshTokenRepository.deleteExpiredRefreshTokens).toHaveBeenCalledWith(now);
    expect(result.deletedCount).toBe(2);
  });
});
