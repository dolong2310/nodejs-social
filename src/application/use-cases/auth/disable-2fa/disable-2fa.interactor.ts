import { UserNotEnabled2FAException } from '@/application/exceptions/otp.exception';
import { UserNotFoundException } from '@/application/exceptions/user.exception';
import { IOtpService } from '@/application/services/otp/otp.service';
import { IUserService } from '@/application/services/user/user.service';
import { Disable2FACommand, Disable2FAInPort } from '@/application/use-cases/auth/disable-2fa/disable-2fa.in-port';
import { EOtpType } from '@/domain/entities/otp/otp.type';
import { UserEntity } from '@/domain/entities/user/user.entity';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';

export class Disable2FAInteractor extends Disable2FAInPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userService: IUserService,
    private readonly otpService: IOtpService
  ) {
    super();
  }

  async execute({ userId, totpCode, emailOtpCode }: Disable2FACommand): Promise<boolean> {
    // 1. Lấy user từ database, kiểm tra user có tồn tại không và kiểm tra đã enable 2FA chưa
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw UserNotFoundException;
    }

    if (!user.totpSecret) {
      throw UserNotEnabled2FAException;
    }

    // 2. Validate TOTP code or email OTP code
    await this.otpService.validateTOTPCodeOrEmailOtpCode({
      totpCode,
      emailOtpCode,
      totpSecret: user.totpSecret,
      email: user.email,
      type: EOtpType.DISABLE_2FA
    });

    // 3. Delete secret key of user from database
    await this.userRepository.updateOne(userId, { totpSecret: null } as Partial<UserEntity>);

    // 4. Return boolean success
    return true;
  }
}
