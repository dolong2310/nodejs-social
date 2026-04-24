import { OtpEntity } from '@/domain/entities/otp/otp.entity';
import { EOtpType } from '@/domain/entities/otp/otp.type';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import { ICreateOtpInput } from '@/domain/repositories/otp/otp.repository.type';

export interface OtpRepositoryPort extends RepositoryPort<OtpEntity> {
  findUniqueOtpCode(data: { email: string; type: EOtpType }): Promise<OtpEntity | null>;
  createOtp(data: ICreateOtpInput): Promise<OtpEntity | null>;
  deleteOtp(id: string): Promise<OtpEntity | null>;
}
