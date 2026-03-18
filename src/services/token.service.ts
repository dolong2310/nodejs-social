import { envConfig } from '@/config';
import { ETokenType } from '@/enums/token.enum';
import { TokenPayload, TokenPayloadCreate } from '@/types/token.type';
import jwt, { type Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';

type TokenSignConfig = {
  secret: string | Secret;
  expiresIn?: StringValue;
};
type TokenSignParams = {
  userId: string;
  type: number;
  exp?: number;
};
type SignOptions = {
  secret: string | Secret;
  expiresIn?: StringValue;
  algorithm?: string;
  exp?: number;
};

const TOKEN_CONFIG: Record<ETokenType, SignOptions> = {
  [ETokenType.ACCESS_TOKEN]: {
    secret: envConfig.ACCESS_TOKEN_SECRET as Secret,
    expiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN as StringValue
  },
  [ETokenType.REFRESH_TOKEN]: {
    secret: envConfig.REFRESH_TOKEN_SECRET as Secret,
    expiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN as StringValue
  },
  [ETokenType.EMAIL_VERIFICATION_TOKEN]: {
    secret: envConfig.EMAIL_TOKEN_SECRET as Secret,
    expiresIn: envConfig.EMAIL_TOKEN_EXPIRES_IN as StringValue
  },
  [ETokenType.FORGOT_PASSWORD_TOKEN]: {
    secret: envConfig.FORGOT_PASSWORD_TOKEN_SECRET as Secret,
    expiresIn: envConfig.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as StringValue
  }
};

export interface ITokenService {
  signAccessToken(input: TokenPayloadCreate): Promise<string>;
  signRefreshToken(input: TokenPayloadCreate & { exp?: number }): Promise<string>;
  signEmailVerificationToken(input: TokenPayloadCreate): Promise<string>;
  signForgotPasswordToken(input: TokenPayloadCreate): Promise<string>;

  verifyAccessToken(token: string): Promise<TokenPayload>;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
  verifyEmailVerificationToken(token: string): Promise<TokenPayload>;
  verifyForgotPasswordToken(token: string): Promise<TokenPayload>;

  signAccessTokenSync(input: TokenPayloadCreate): string;
  signRefreshTokenSync(input: TokenPayloadCreate & { exp?: number }): string;
  signEmailVerificationTokenSync(input: TokenPayloadCreate): string;
  signForgotPasswordTokenSync(input: TokenPayloadCreate): string;

  verifyAccessTokenSync(token: string): TokenPayload;
  verifyRefreshTokenSync(token: string): TokenPayload;
  verifyEmailVerificationTokenSync(token: string): TokenPayload;
  verifyForgotPasswordTokenSync(token: string): TokenPayload;
}

class TokenService implements ITokenService {
  constructor() {}

  private signTokenSync(params: TokenSignParams, config: TokenSignConfig): string {
    // Add a uuid for uniqueness
    const { userId, type, exp } = params;
    const payload: any = { uuid: uuidv4(), userId, type };
    if (typeof exp === 'number') payload.exp = exp;

    const options: jwt.SignOptions = {
      algorithm: 'HS256'
    };
    if (!exp && config.expiresIn) options.expiresIn = config.expiresIn;

    return jwt.sign(payload, config.secret, options);
  }

  private async signToken(params: TokenSignParams, config: TokenSignConfig): Promise<string> {
    return Promise.resolve(this.signTokenSync(params, config));
  }

  private verifyTokenSync<T>(token: string, secret: string | Secret): T {
    return jwt.verify(token, secret) as T;
  }

  private async verifyToken<T>(token: string, secret: string | Secret): Promise<T> {
    return Promise.resolve(this.verifyTokenSync<T>(token, secret));
  }

  // Access Token
  signAccessToken({ userId, type }: TokenPayloadCreate): Promise<string> {
    return this.signToken({ userId, type }, TOKEN_CONFIG[ETokenType.ACCESS_TOKEN]);
  }
  signAccessTokenSync({ userId, type }: TokenPayloadCreate): string {
    return this.signTokenSync({ userId, type }, TOKEN_CONFIG[ETokenType.ACCESS_TOKEN]);
  }
  verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.verifyToken<TokenPayload>(token, TOKEN_CONFIG[ETokenType.ACCESS_TOKEN].secret);
  }
  verifyAccessTokenSync(token: string): TokenPayload {
    return this.verifyTokenSync<TokenPayload>(token, TOKEN_CONFIG[ETokenType.ACCESS_TOKEN].secret);
  }

  // Refresh Token
  signRefreshToken({ userId, type, exp }: TokenPayloadCreate & { exp?: number }): Promise<string> {
    return this.signToken({ userId, type, exp }, TOKEN_CONFIG[ETokenType.REFRESH_TOKEN]);
  }
  signRefreshTokenSync({ userId, type, exp }: TokenPayloadCreate & { exp?: number }): string {
    return this.signTokenSync({ userId, type, exp }, TOKEN_CONFIG[ETokenType.REFRESH_TOKEN]);
  }
  verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.verifyToken<TokenPayload>(token, TOKEN_CONFIG[ETokenType.REFRESH_TOKEN].secret);
  }
  verifyRefreshTokenSync(token: string): TokenPayload {
    return this.verifyTokenSync<TokenPayload>(token, TOKEN_CONFIG[ETokenType.REFRESH_TOKEN].secret);
  }

  // Email Verification Token
  signEmailVerificationToken({ userId, type }: TokenPayloadCreate): Promise<string> {
    return this.signToken({ userId, type }, TOKEN_CONFIG[ETokenType.EMAIL_VERIFICATION_TOKEN]);
  }
  signEmailVerificationTokenSync({ userId, type }: TokenPayloadCreate): string {
    return this.signTokenSync({ userId, type }, TOKEN_CONFIG[ETokenType.EMAIL_VERIFICATION_TOKEN]);
  }
  verifyEmailVerificationToken(token: string): Promise<TokenPayload> {
    return this.verifyToken<TokenPayload>(token, TOKEN_CONFIG[ETokenType.EMAIL_VERIFICATION_TOKEN].secret);
  }
  verifyEmailVerificationTokenSync(token: string): TokenPayload {
    return this.verifyTokenSync<TokenPayload>(token, TOKEN_CONFIG[ETokenType.EMAIL_VERIFICATION_TOKEN].secret);
  }

  // Forgot Password Token
  signForgotPasswordToken({ userId, type }: TokenPayloadCreate): Promise<string> {
    return this.signToken({ userId, type }, TOKEN_CONFIG[ETokenType.FORGOT_PASSWORD_TOKEN]);
  }
  signForgotPasswordTokenSync({ userId, type }: TokenPayloadCreate): string {
    return this.signTokenSync({ userId, type }, TOKEN_CONFIG[ETokenType.FORGOT_PASSWORD_TOKEN]);
  }
  verifyForgotPasswordToken(token: string): Promise<TokenPayload> {
    return this.verifyToken<TokenPayload>(token, TOKEN_CONFIG[ETokenType.FORGOT_PASSWORD_TOKEN].secret);
  }
  verifyForgotPasswordTokenSync(token: string): TokenPayload {
    return this.verifyTokenSync<TokenPayload>(token, TOKEN_CONFIG[ETokenType.FORGOT_PASSWORD_TOKEN].secret);
  }
}

export default TokenService;
