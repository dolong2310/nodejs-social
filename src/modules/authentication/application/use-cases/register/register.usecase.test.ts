import { OtpServicePort } from '@/modules/authentication/application/services/otp.service';
import { RegisterInputPort } from '@/modules/authentication/application/use-cases/register/register.port';
import { RegisterUseCase } from '@/modules/authentication/application/use-cases/register/register.usecase';
import { OtpEntity } from '@/modules/authentication/domain/entities/otp.entity';
import { EnumOtpType } from '@/modules/authentication/domain/entities/otp.types';
import { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { makeUserFullProps } from '@test/support/builders/user.builder';
import { entityDouble, idDouble } from '@test/support/doubles/entity.double';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const createdUser = makeUserFullProps({ password: 'hashed-password', username: 'user_generated' });

describe('RegisterUseCase', () => {
  it('validates register OTP, creates a user, deletes OTP, and returns safe user data', async () => {
    const otpEntity = idDouble('otp_1') as unknown as OtpEntity;
    const userRepository = mockPort<UserRepositoryPort>({
      findUserByEmail: vi.fn().mockResolvedValue(null),
      insert: vi.fn().mockResolvedValue(entityDouble(createdUser) as unknown as UserEntity)
    });
    const hashingService = mockPort<HashingPort>({
      hash: vi.fn().mockResolvedValue('hashed-password')
    });
    const otpRepository = mockPort<OtpRepositoryPort>({
      deleteOtp: vi.fn().mockResolvedValue(otpEntity)
    });
    const otpService = mockPort<OtpServicePort>({
      findAndValidateOtpCode: vi.fn().mockResolvedValue(otpEntity)
    });
    const roleService = mockPort<RoleServicePort>({
      getUserRoleId: vi.fn().mockResolvedValue('role_user')
    });
    const useCase = new RegisterUseCase(userRepository, hashingService, otpRepository, otpService, roleService);

    const result = await useCase.execute(
      new RegisterInputPort({
        name: 'Long Do',
        email: ' Long@Example.com ',
        password: 'password',
        birthday: '1995-01-01',
        code: '123456'
      })
    );

    expect(otpService.findAndValidateOtpCode).toHaveBeenCalledWith({
      email: createdUser.email,
      code: '123456',
      type: EnumOtpType.REGISTER
    });
    expect(hashingService.hash).toHaveBeenCalledWith('password');
    expect(userRepository.findUserByEmail).toHaveBeenCalledWith(createdUser.email);
    expect(userRepository.insert).toHaveBeenCalledWith(expect.any(UserEntity), {
      projection: { password: 0, totpSecret: 0 }
    });
    expect(otpRepository.deleteOtp).toHaveBeenCalledWith('otp_1');
    expect(result).toMatchObject({ id: createdUser.id, email: createdUser.email });
  });
});
