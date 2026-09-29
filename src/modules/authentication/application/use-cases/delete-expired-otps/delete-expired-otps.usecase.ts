import {
  DeleteExpiredOtpsInputPort,
  DeleteExpiredOtpsPort,
  DeleteExpiredOtpsOutputPort
} from '@/modules/authentication/application/use-cases/delete-expired-otps/delete-expired-otps.port';
import { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';

export class DeleteExpiredOtpsUseCase extends DeleteExpiredOtpsPort {
  constructor(private readonly otpRepository: OtpRepositoryPort) {
    super();
  }

  async execute(input: DeleteExpiredOtpsInputPort): Promise<DeleteExpiredOtpsOutputPort> {
    const deletedCount = await this.otpRepository.deleteExpiredOtps(input.now);
    return new DeleteExpiredOtpsOutputPort({ deletedCount });
  }
}
