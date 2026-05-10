import { OtpEntity } from '@/modules/authentication/domain/entities/otp.entity';
import { EOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { ICreateOtpInput } from '@/modules/authentication/domain/repositories/otp.repository.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface OtpRepositoryPort extends RepositoryPort<OtpEntity> {
  findUniqueOtpCode(data: { email: string; type: EOtpType }): Promise<OtpEntity | null>;
  createOtp(data: ICreateOtpInput): Promise<OtpEntity | null>;
  deleteOtp(id: string): Promise<OtpEntity | null>;
  deleteExpiredOtps(now: Date): Promise<number>;
}
