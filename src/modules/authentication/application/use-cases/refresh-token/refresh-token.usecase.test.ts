import { AuthServicePort } from '@/modules/authentication/application/services/auth.service';
import { TokenServicePort } from '@/modules/authentication/application/services/token.service.types';
import { RefreshTokenInputPort } from '@/modules/authentication/application/use-cases/refresh-token/refresh-token.port';
import { RefreshTokenUseCase } from '@/modules/authentication/application/use-cases/refresh-token/refresh-token.usecase';
import { RefreshTokenRepositoryPort } from '@/modules/authentication/domain/repositories/refresh-token.repository';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import { makeUserWithRole } from '@test/support/builders/user.builder';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const user = makeUserWithRole({ password: 'hash' });

describe('RefreshTokenUseCase', () => {
  it('verifies, rotates, and returns a new token pair', async () => {
    const refreshTokenRepository = mockPort<RefreshTokenRepositoryPort>({
      rotateRefreshToken: vi.fn().mockResolvedValue(true)
    });
    const userQueryRepository = mockPort<UserQueryRepositoryPort>({
      findUserByIdIncludeRole: vi.fn().mockResolvedValue(user)
    });
    const authService = mockPort<AuthServicePort>({
      createAuthSession: vi.fn().mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' })
    });
    const tokenService = mockPort<TokenServicePort>({
      verifyRefreshToken: vi
        .fn()
        .mockResolvedValueOnce({ userId: user.id, exp: 1_800_000_000, iat: 1_700_000_000 })
        .mockResolvedValueOnce({ userId: user.id, exp: 1_900_000_000, iat: 1_700_000_000 })
    });
    const useCase = new RefreshTokenUseCase(refreshTokenRepository, userQueryRepository, authService, tokenService);

    const result = await useCase.execute(new RefreshTokenInputPort({ refreshToken: 'old-refresh' }));

    expect(result).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    expect(authService.createAuthSession).toHaveBeenCalledWith({
      userId: user.id,
      roleId: user.roleId,
      roleName: user.role?.name
    });
    expect(refreshTokenRepository.rotateRefreshToken).toHaveBeenCalledWith({
      userId: user.id,
      oldToken: 'old-refresh',
      newToken: 'new-refresh',
      expiresAt: new Date(1_900_000_000 * 1000)
    });
  });
});
