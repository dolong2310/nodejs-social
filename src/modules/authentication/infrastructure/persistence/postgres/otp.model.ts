import { EnumOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, object, pipe, string } from 'valibot';

export const otpSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  email: pipe(string(), minLength(1)),
  code: pipe(string(), minLength(1)),
  type: enum_(EnumOtpType),
  expires_at: date(),
  created_at: date(),
  updated_at: date()
});

export type OtpModel = InferOutput<typeof otpSchema>;
