import { envConfig } from '@/constants/config.constant';
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
import jwt, { type Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';

class TokenService {
  constructor() {}

  signAccessToken({ userId, type }: AccessTokenPayloadCreate): Promise<string> {
    // thêm uuid để tránh trường hợp 2 request cùng payload được gọi cùng 1 thời điểm thì sẽ bị trùng jwt token
    // thêm uuid để tạo khác biệt giữa 2 jwt token
    return Promise.resolve(
      jwt.sign({ uuid: uuidv4(), userId, type }, envConfig.ACCESS_TOKEN_SECRET as Secret, {
        expiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN as StringValue,
        algorithm: 'HS256'
      })
    );
  }

  signRefreshToken({ userId, type, exp }: RefreshTokenPayloadCreate & { exp?: number }): Promise<string> {
    if (exp && typeof exp === 'number') {
      return Promise.resolve(
        jwt.sign({ uuid: uuidv4(), userId, type, exp }, envConfig.REFRESH_TOKEN_SECRET as Secret, {
          algorithm: 'HS256'
        })
      );
    }
    // thêm uuid để tránh trường hợp 2 request cùng payload được gọi cùng 1 thời điểm thì sẽ bị trùng jwt token
    // thêm uuid để tạo khác biệt giữa 2 jwt token
    return Promise.resolve(
      jwt.sign({ uuid: uuidv4(), userId, type }, envConfig.REFRESH_TOKEN_SECRET as Secret, {
        expiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN as StringValue,
        algorithm: 'HS256'
      })
    );
  }

  signEmailVerificationToken({ userId, type }: EmailVerificationTokenPayloadCreate): Promise<string> {
    return Promise.resolve(
      jwt.sign({ uuid: uuidv4(), userId, type }, envConfig.EMAIL_TOKEN_SECRET as Secret, {
        expiresIn: envConfig.EMAIL_TOKEN_EXPIRES_IN as StringValue,
        algorithm: 'HS256'
      })
    );
  }

  signForgotPasswordToken({ userId, type }: ForgotPasswordTokenPayloadCreate): Promise<string> {
    return Promise.resolve(
      jwt.sign({ uuid: uuidv4(), userId, type }, envConfig.FORGOT_PASSWORD_TOKEN_SECRET as Secret, {
        expiresIn: envConfig.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as StringValue,
        algorithm: 'HS256'
      })
    );
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return Promise.resolve(jwt.verify(token, envConfig.ACCESS_TOKEN_SECRET as Secret) as AccessTokenPayload);
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return Promise.resolve(jwt.verify(token, envConfig.REFRESH_TOKEN_SECRET as Secret) as RefreshTokenPayload);
  }

  verifyEmailVerificationToken(token: string): Promise<EmailVerificationTokenPayload> {
    return Promise.resolve(jwt.verify(token, envConfig.EMAIL_TOKEN_SECRET as Secret) as EmailVerificationTokenPayload);
  }

  verifyForgotPasswordToken(token: string): Promise<ForgotPasswordTokenPayload> {
    return Promise.resolve(
      jwt.verify(token, envConfig.FORGOT_PASSWORD_TOKEN_SECRET as Secret) as ForgotPasswordTokenPayload
    );
  }
}

export default new TokenService();
