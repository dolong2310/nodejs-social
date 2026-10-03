import { InvalidTokenException } from '@/modules/authentication/application/exceptions/auth.exception';
import { RefreshTokenExpiredException } from '@/modules/authentication/application/exceptions/refresh-token.exception';
import type { AuthServicePort } from '@/modules/authentication/application/services/auth.service';
import type { TokenServicePort } from '@/modules/authentication/application/services/token.service.types';
import { RefreshTokenInputPort } from '@/modules/authentication/application/use-cases/refresh-token/refresh-token.port';
import { RefreshTokenUseCase } from '@/modules/authentication/application/use-cases/refresh-token/refresh-token.usecase';
import type { RefreshTokenRepositoryPort } from '@/modules/authentication/domain/repositories/refresh-token.repository';
import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import type { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import { makeUserWithRole } from '@test/support/builders/user.builder';
import { mockPort } from '@test/support/mocks/port.mock';
import jwt from 'jsonwebtoken';
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

  function makeUseCase(
    overrides: Partial<
      Pick<TokenServicePort, 'verifyRefreshToken'> & Pick<UserQueryRepositoryPort, 'findUserByIdIncludeRole'>
    > = {}
  ) {
    const refreshTokenRepository = mockPort<RefreshTokenRepositoryPort>({
      rotateRefreshToken: vi.fn().mockResolvedValue(true)
    });
    const userQueryRepository = mockPort<UserQueryRepositoryPort>({
      findUserByIdIncludeRole: overrides.findUserByIdIncludeRole ?? vi.fn().mockResolvedValue(user)
    });
    const authService = mockPort<AuthServicePort>({ createAuthSession: vi.fn() });
    const tokenService = mockPort<TokenServicePort>({
      verifyRefreshToken:
        overrides.verifyRefreshToken ??
        vi.fn().mockResolvedValue({ userId: user.id, exp: 1_800_000_000, iat: 1_700_000_000 })
    });
    return new RefreshTokenUseCase(refreshTokenRepository, userQueryRepository, authService, tokenService);
  }

  it('maps an expired refresh token to RefreshTokenExpiredException', async () => {
    const useCase = makeUseCase({
      verifyRefreshToken: vi.fn().mockRejectedValue(new jwt.TokenExpiredError('jwt expired', new Date()))
    });

    await expect(useCase.execute(new RefreshTokenInputPort({ refreshToken: 'old' }))).rejects.toBeInstanceOf(
      RefreshTokenExpiredException
    );
  });

  it('maps an invalid refresh token to InvalidTokenException', async () => {
    const useCase = makeUseCase({
      verifyRefreshToken: vi.fn().mockRejectedValue(new jwt.JsonWebTokenError('invalid signature'))
    });

    await expect(useCase.execute(new RefreshTokenInputPort({ refreshToken: 'old' }))).rejects.toBeInstanceOf(
      InvalidTokenException
    );
  });

  it('rethrows non-JWT errors unchanged', async () => {
    const useCase = makeUseCase({ findUserByIdIncludeRole: vi.fn().mockResolvedValue(null) });

    await expect(useCase.execute(new RefreshTokenInputPort({ refreshToken: 'old' }))).rejects.toBeInstanceOf(
      UserNotFoundException
    );
  });
});
