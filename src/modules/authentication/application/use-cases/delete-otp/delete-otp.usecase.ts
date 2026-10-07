import {
  type DeleteOtpInputPort,
  DeleteOtpPort
} from '@/modules/authentication/application/use-cases/delete-otp/delete-otp.port';
import type { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';

export class DeleteOtpUseCase extends DeleteOtpPort {
  constructor(private readonly otpRepository: OtpRepositoryPort) {
    super();
  }

  async execute(input: DeleteOtpInputPort): Promise<void> {
    await this.otpRepository.deleteOtp(input.otpId);
  }
}
