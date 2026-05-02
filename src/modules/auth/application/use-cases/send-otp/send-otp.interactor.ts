import { IEmailQueue } from '@/modules/core/application/ports/email-job.port';
import { SendOtpCommand, SendOtpInPort } from '@/modules/auth/application/use-cases/send-otp/send-otp.in-port';
import { EOtpType } from '@/modules/auth/domain/entities/otp.type';
import { OtpRepositoryPort } from '@/modules/auth/domain/repositories/otp.repository';
import {
  EmailAlreadyExistsException,
  EmailNotFoundException,
  FailedToSendOtpCodeException
} from '@/modules/auth/application/auth.exception';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { randomInt } from 'crypto';
import { addMilliseconds } from 'date-fns';
import ms from 'ms';

export class SendOtpInteractor extends SendOtpInPort {
  constructor(
    private readonly otpRepository: OtpRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
    private readonly emailQueue: IEmailQueue
  ) {
    super();
  }

  async execute({ email, type }: SendOtpCommand): Promise<void> {
    // 1. Check email exists in database and check type
    const user = await this.userRepository.findUserByEmail(email);

    if (user && type === EOtpType.REGISTER) {
      throw EmailAlreadyExistsException;
    }

    if (!user && type === EOtpType.FORGOT_PASSWORD) {
      throw EmailNotFoundException;
    }

    // 2. Create otp code
    // 2.1 Generate OTP code
    const generatedOtpCode = this.generateOtpCode();

    // 2.2 Create OTP code in database
    const otpCode = await this.otpRepository.createOtp({
      email: email,
      code: generatedOtpCode,
      type: type,
      expiresAt: addMilliseconds(new Date(), ms('5m')) // TODO: use env config
    });

    console.log('generatedOtpCode: ', generatedOtpCode); // TODO: remove this after testing

    if (!otpCode) {
      throw FailedToSendOtpCodeException;
    }

    // 3. Send OTP to email (worker deletes OTP if delivery ultimately fails)
    await this.emailQueue.add({
      toAddress: email,
      subject: 'OTP Code',
      body: {
        code: generatedOtpCode,
        otpId: otpCode.id.toString()
      }
    });

    // 4. Do not return otp code, because user must get code from email
    // message: OTP code has been sent to email
  }

  private generateOtpCode(): string {
    // 6 chữ số
    // min <= n < max
    // -> n có thể là 100000, 100001, ..., 999999
    return randomInt(100000, 1000000).toString();
    // return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
