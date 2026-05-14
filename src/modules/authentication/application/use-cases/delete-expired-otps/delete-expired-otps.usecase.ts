import {
  DeleteExpiredOtpsCommand,
  DeleteExpiredOtpsPort,
  DeleteExpiredOtpsResult
} from '@/modules/authentication/application/use-cases/delete-expired-otps/delete-expired-otps.port';
import { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';

export class DeleteExpiredOtpsUseCase extends DeleteExpiredOtpsPort {
  constructor(private readonly otpRepository: OtpRepositoryPort) {
    super();
  }

  async execute(command: DeleteExpiredOtpsCommand): Promise<DeleteExpiredOtpsResult> {
    const deletedCount = await this.otpRepository.deleteExpiredOtps(command.now);
    return new DeleteExpiredOtpsResult({ deletedCount });
  }
}
