import { OtpEntity } from '@/modules/auth/domain/entities/otp.entity';
import { EOtpType } from '@/modules/auth/domain/entities/otp.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { ICreateOtpInput } from '@/modules/auth/domain/repositories/otp.repository.type';

export interface OtpRepositoryPort extends RepositoryPort<OtpEntity> {
  findUniqueOtpCode(data: { email: string; type: EOtpType }): Promise<OtpEntity | null>;
  createOtp(data: ICreateOtpInput): Promise<OtpEntity | null>;
  deleteOtp(id: string): Promise<OtpEntity | null>;
}
