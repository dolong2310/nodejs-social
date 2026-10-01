import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { OtpCode } from '@/modules/authentication/domain/value-objects/otp-code.value-object';
import { EmailAddress } from '@/modules/common/domain/value-objects/email-address.value-object';
import type { Prettify } from 'ts-essentials';

export interface OtpProps {
  email: EmailAddress;
  code: OtpCode;
  type: EnumOtpType;
  expiresAt: Date;
}

export interface OtpPrimitiveProps extends Omit<OtpProps, 'email' | 'code'> {
  email: string;
  code: string;
}

export interface OtpFullProps extends Prettify<OtpPrimitiveProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreateOtpProps extends OtpPrimitiveProps {}

export enum EnumOtpType {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  DISABLE_2FA = 'DISABLE_2FA'
}
