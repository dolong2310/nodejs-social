import {
  AccessTokenPayload,
  AccessTokenPayloadCreate,
  EmailVerificationTokenPayload,
  EmailVerificationTokenPayloadCreate,
  ForgotPasswordTokenPayload,
  ForgotPasswordTokenPayloadCreate,
  RefreshTokenPayload,
  RefreshTokenPayloadCreate
} from '@/types/token.type';
import dotenv from 'dotenv';
import jwt, { type Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

class TokenService {
  constructor() {}

  signAccessToken({ userId, type }: AccessTokenPayloadCreate): Promise<string> {
    // thêm uuid để tránh trường hợp 2 request cùng payload được gọi cùng 1 thời điểm thì sẽ bị trùng jwt token
    // thêm uuid để tạo khác biệt giữa 2 jwt token
    return Promise.resolve(
      jwt.sign({ uuid: uuidv4(), userId, type }, process.env.ACCESS_TOKEN_SECRET as Secret, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as StringValue,
        algorithm: 'HS256'
      })
    );
  }

  signRefreshToken({ userId, type }: RefreshTokenPayloadCreate): Promise<string> {
    // thêm uuid để tránh trường hợp 2 request cùng payload được gọi cùng 1 thời điểm thì sẽ bị trùng jwt token
    // thêm uuid để tạo khác biệt giữa 2 jwt token
    return Promise.resolve(
      jwt.sign({ uuid: uuidv4(), userId, type }, process.env.REFRESH_TOKEN_SECRET as Secret, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue,
        algorithm: 'HS256'
      })
    );
  }

  signEmailVerificationToken({ userId, type }: EmailVerificationTokenPayloadCreate): Promise<string> {
    return Promise.resolve(
      jwt.sign({ uuid: uuidv4(), userId, type }, process.env.EMAIL_TOKEN_SECRET as Secret, {
        expiresIn: process.env.EMAIL_TOKEN_EXPIRES_IN as StringValue,
        algorithm: 'HS256'
      })
    );
  }

  signForgotPasswordToken({ userId, type }: ForgotPasswordTokenPayloadCreate): Promise<string> {
    return Promise.resolve(
      jwt.sign({ uuid: uuidv4(), userId, type }, process.env.FORGOT_PASSWORD_TOKEN_SECRET as Secret, {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as StringValue,
        algorithm: 'HS256'
      })
    );
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return Promise.resolve(jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as Secret) as AccessTokenPayload);
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return Promise.resolve(jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as Secret) as RefreshTokenPayload);
  }

  verifyEmailVerificationToken(token: string): Promise<EmailVerificationTokenPayload> {
    return Promise.resolve(
      jwt.verify(token, process.env.EMAIL_TOKEN_SECRET as Secret) as EmailVerificationTokenPayload
    );
  }

  verifyForgotPasswordToken(token: string): Promise<ForgotPasswordTokenPayload> {
    return Promise.resolve(
      jwt.verify(token, process.env.FORGOT_PASSWORD_TOKEN_SECRET as Secret) as ForgotPasswordTokenPayload
    );
  }
}

export default new TokenService();
