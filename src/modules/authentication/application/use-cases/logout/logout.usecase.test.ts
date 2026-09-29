import { LogoutInputPort } from '@/modules/authentication/application/use-cases/logout/logout.port';
import { LogoutUseCase } from '@/modules/authentication/application/use-cases/logout/logout.usecase';
import { RefreshTokenEntity } from '@/modules/authentication/domain/entities/refresh-token.entity';
import { RefreshTokenRepositoryPort } from '@/modules/authentication/domain/repositories/refresh-token.repository';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

describe('LogoutUseCase', () => {
  it('deletes an existing refresh token', async () => {
    const refreshTokenRepository = mockPort<RefreshTokenRepositoryPort>({
      findRefreshToken: vi.fn().mockResolvedValue({} as RefreshTokenEntity),
      deleteRefreshToken: vi.fn().mockResolvedValue(true)
    });
    const useCase = new LogoutUseCase(refreshTokenRepository);

    const result = await useCase.execute(new LogoutInputPort({ refreshToken: 'refresh' }));

    expect(result).toBe(true);
    expect(refreshTokenRepository.findRefreshToken).toHaveBeenCalledWith('refresh');
    expect(refreshTokenRepository.deleteRefreshToken).toHaveBeenCalledWith('refresh');
  });
});
