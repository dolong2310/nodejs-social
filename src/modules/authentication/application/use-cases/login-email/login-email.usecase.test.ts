import { AuthServicePort } from '@/modules/authentication/application/services/auth.service';
import { OtpServicePort } from '@/modules/authentication/application/services/otp.service';
import { LoginEmailCommand } from '@/modules/authentication/application/use-cases/login-email/login-email.port';
import { LoginEmailUseCase } from '@/modules/authentication/application/use-cases/login-email/login-email.usecase';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import { makeUserWithRole } from '@test/support/builders/user.builder';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const user = makeUserWithRole({ password: 'hash' });

describe('LoginEmailUseCase', () => {
  it('authenticates a valid email/password pair and creates a persisted auth session', async () => {
    const userQueryRepository = mockPort<UserQueryRepositoryPort>({
      findUserByEmailIncludeRole: vi.fn().mockResolvedValue(user)
    });
    const otpService = mockPort<OtpServicePort>({
      validateTOTPCodeOrEmailOtpCode: vi.fn().mockResolvedValue(undefined)
    });
    const hashingService = mockPort<HashingPort>({
      compare: vi.fn().mockResolvedValue(true)
    });
    const authService = mockPort<AuthServicePort>({
      createAuthSession: vi.fn().mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' })
    });
    const useCase = new LoginEmailUseCase(userQueryRepository, otpService, hashingService, authService);

    const result = await useCase.execute(
      new LoginEmailCommand({ email: ' Long@Example.com ', password: 'password', totpCode: '123456' })
    );

    expect(userQueryRepository.findUserByEmailIncludeRole).toHaveBeenCalledWith(user.email);
    expect(hashingService.compare).toHaveBeenCalledWith('password', user.password);
    expect(authService.createAuthSession).toHaveBeenCalledWith(
      { userId: user.id, roleId: user.roleId, roleName: user.role?.name },
      { isCreateInDatabase: true }
    );
    expect(result).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
  });
});
