import type { OtpEntity } from '@/modules/authentication/domain/entities/otp.entity';
import type { EnumOtpType } from '@/modules/authentication/domain/entities/otp.types';
import type { CreateOtpInput } from '@/modules/authentication/domain/repositories/otp.repository.types';
import type { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface OtpRepositoryPort extends RepositoryPort<OtpEntity> {
  findUniqueOtpCode(data: { email: string; type: EnumOtpType }): Promise<OtpEntity | null>;
  createOtp(data: CreateOtpInput): Promise<OtpEntity | null>;
  deleteOtp(id: string): Promise<OtpEntity | null>;
  deleteExpiredOtps(now: Date): Promise<number>;
}
