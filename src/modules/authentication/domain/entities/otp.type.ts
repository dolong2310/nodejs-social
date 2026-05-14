import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import type { Prettify } from 'ts-essentials';

export interface OtpProps {
  email: string;
  code: string;
  type: EnumOtpType;
  expiresAt: Date;
}

export interface OtpFullProps extends Prettify<OtpProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreateOtpProps extends OtpProps {}

export enum EnumOtpType {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  DISABLE_2FA = 'DISABLE_2FA'
}
