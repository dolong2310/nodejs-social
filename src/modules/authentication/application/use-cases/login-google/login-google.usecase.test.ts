import { GoogleOAuthServicePort } from '@/modules/authentication/application/ports/google-oauth.port';
import { AuthServicePort } from '@/modules/authentication/application/services/auth.service';
import { LoginGoogleCommand } from '@/modules/authentication/application/use-cases/login-google/login-google.port';
import { LoginGoogleUseCase } from '@/modules/authentication/application/use-cases/login-google/login-google.usecase';
import { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { makeUserFullProps } from '@test/support/builders/user.builder';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const user = makeUserFullProps({ password: 'hash' });

describe('LoginGoogleUseCase', () => {
  it('creates an auth session for an existing verified Google account', async () => {
    const googleOAuthService = mockPort<GoogleOAuthServicePort>({
      getUserInfoFromCode: vi.fn().mockResolvedValue({ email: user.email, name: user.name, verifiedEmail: true })
    });
    const userRepository = mockPort<UserRepositoryPort>();
    const hashingService = mockPort<HashingPort>();
    const roleService = mockPort<RoleServicePort>();
    const authService = mockPort<AuthServicePort>({
      createAuthSession: vi.fn().mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' })
    });
    const userService = mockPort<UserServicePort>({
      findUserByEmail: vi.fn().mockResolvedValue(user)
    });
    const useCase = new LoginGoogleUseCase(
      googleOAuthService,
      userRepository,
      hashingService,
      roleService,
      authService,
      userService
    );

    const result = await useCase.execute(new LoginGoogleCommand({ state: 'state', code: 'oauth-code' }));

    expect(googleOAuthService.getUserInfoFromCode).toHaveBeenCalledWith('oauth-code');
    expect(authService.createAuthSession).toHaveBeenCalledWith(
      { userId: user.id, roleId: user.roleId, roleName: 'USER' },
      { isCreateInDatabase: true }
    );
    expect(result).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
  });
});
