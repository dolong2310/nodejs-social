import { EOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, object, optional, pipe, string } from 'valibot';

export const otpSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  email: pipe(string(), minLength(1)),
  code: pipe(string(), minLength(1)),
  type: enum_(EOtpType),
  expires_at: date(),
  created_at: optional(date(), new Date()),
  updated_at: optional(date(), new Date())
});

export type OtpModel = InferOutput<typeof otpSchema>;
