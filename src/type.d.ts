import {
  AccessTokenPayload,
  RefreshTokenPayload,
  EmailVerificationTokenPayload,
  ForgotPasswordTokenPayload
} from '@/types/token.type';
import { IUser } from '@/models/schemas/user.schema';
import { Request } from 'express';

declare module 'express' {
  interface Request {
    user?: IUser;
    accessTokenPayload?: AccessTokenPayload;
    refreshTokenPayload?: RefreshTokenPayload;
    emailVerificationTokenPayload?: EmailVerificationTokenPayload;
    forgotPasswordTokenPayload?: ForgotPasswordTokenPayload;
  }
}
