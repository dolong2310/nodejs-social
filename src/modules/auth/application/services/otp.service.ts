import { ExpiredOtpCodeException, InvalidOtpCodeException } from '@/modules/auth/application/otp.exception';
import { ITwoFactorAuthPort } from '@/modules/core/application/ports/2fa.port';
import { OtpEntity } from '@/modules/auth/domain/entities/otp.entity';
import { EOtpType } from '@/modules/auth/domain/entities/otp.type';
import { OtpRepositoryPort } from '@/modules/auth/domain/repositories/otp.repository';

export interface IOtpService {
  findAndValidateOtpCode(data: { email: string; code: string; type: EOtpType }): Promise<OtpEntity>;
  validateTOTPCodeOrEmailOtpCode(data: {
    totpCode?: string;
    emailOtpCode?: string;
    totpSecret: string;
    email: string;
    type: EOtpType;
  }): Promise<void>;
}

export class OtpService {
  constructor(
    private readonly otpRepository: OtpRepositoryPort,
    private readonly twoFactorAuthenticationService: ITwoFactorAuthPort
  ) {}

  async findAndValidateOtpCode(data: { email: string; code: string; type: EOtpType }): Promise<OtpEntity> {
    const otpEntity = await this.otpRepository.findUniqueOtpCode({
      email: data.email,
      type: data.type
    });

    if (!otpEntity) {
      throw InvalidOtpCodeException;
    }

    const otp = otpEntity.toObject();

    if (otp.code !== data.code) {
      throw InvalidOtpCodeException;
    }

    if (otp.expiresAt < new Date()) {
      // Delete OTP code
      await this.otpRepository.deleteOtp(otp.id);
      throw ExpiredOtpCodeException;
    }

    return otpEntity;
  }

  async validateTOTPCodeOrEmailOtpCode({
    totpCode,
    emailOtpCode,
    totpSecret,
    email,
    type
  }: {
    totpCode?: string;
    emailOtpCode?: string;
    totpSecret: string;
    email: string;
    type: EOtpType;
  }): Promise<void> {
    // Check TOTP code is valid or email OTP code is valid
    // 1. Throw error if body does not have totpCode and emailOtpCode
    if (!totpCode && !emailOtpCode) {
      throw InvalidOtpCodeException;
    }

    // 2. Check TOTP code is valid or email OTP code is valid
    if (totpCode) {
      // 2.1 Verify TOTP code
      const isTOTPValid = this.twoFactorAuthenticationService.verifyTOTP({
        email: email,
        secret: totpSecret,
        token: totpCode
      });

      if (!isTOTPValid) {
        throw InvalidOtpCodeException;
      }
    } else if (emailOtpCode) {
      // 2.2 Verify email OTP code
      // emailOtpCode là option nếu như user đã enable 2FA bằng TOTP nhưng giả sử không có thiết bị để lấy được TOTP code thì sẽ dùng OTP gửi qua email để login
      // vì vậy không cần check email OTP code mỗi lần login
      const otpCode = await this.findAndValidateOtpCode({
        email: email,
        code: emailOtpCode,
        type: type
      });
      // 2.3 Delete OTP code
      await this.otpRepository.deleteOtp(otpCode.id.toString());
    }
  }
}
