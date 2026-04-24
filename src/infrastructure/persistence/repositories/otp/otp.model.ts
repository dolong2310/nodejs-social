import { EOtpType } from '@/domain/entities/otp/otp.type';
import { ENTITY_ID_LENGTH } from '@/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, object, optional, pipe, string } from 'valibot';

export const otpSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  email: pipe(string(), minLength(1)),
  code: pipe(string(), minLength(1)),
  type: enum_(EOtpType),
  expiresAt: date(),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type OtpModel = InferOutput<typeof otpSchema>;
