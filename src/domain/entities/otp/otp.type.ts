import { BaseEntityProps } from '@/domain/entities/base/base.entity';
import type { Prettify } from 'ts-essentials';

export interface OtpProps {
  email: string;
  code: string;
  type: EOtpType;
  expiresAt: Date;
}

// Properties that are needed for a otp retrieval
export interface OtpFullProps extends Prettify<OtpProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

// Properties that are needed for a otp creation
export interface CreateOtpProps extends OtpProps {}

export enum EOtpType {
  LOGIN,
  REGISTER,
  FORGOT_PASSWORD,
  DISABLE_2FA
}
