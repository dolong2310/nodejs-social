import { EnumOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, nullable, enum_, minLength, object, pipe, string } from 'valibot';

export const otpSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  email: pipe(string(), minLength(1)),
  code: pipe(string(), minLength(1)),
  type: enum_(EnumOtpType),
  expires_at: date(),
  created_at: date(),
  created_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  updated_at: date(),
  updated_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  deleted_at: nullable(date(), null),
  deleted_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)
});

export type OtpModel = InferOutput<typeof otpSchema>;
