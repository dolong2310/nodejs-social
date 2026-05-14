import { OtpEntity } from '@/modules/authentication/domain/entities/otp.entity';
import { EnumOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { CreateOtpInput } from '@/modules/authentication/domain/repositories/otp.repository.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface OtpRepositoryPort extends RepositoryPort<OtpEntity> {
  findUniqueOtpCode(data: { email: string; type: EnumOtpType }): Promise<OtpEntity | null>;
  createOtp(data: CreateOtpInput): Promise<OtpEntity | null>;
  deleteOtp(id: string): Promise<OtpEntity | null>;
  deleteExpiredOtps(now: Date): Promise<number>;
}
