import { config } from '@/config';
import { ETokenType, TokenPayload, TokenPayloadCreate } from '@/interfaces';
import jwt, { type Algorithm, type Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';

type TokenSignParams = {
  userId: string;
  type: number;
  exp?: number;
};
type SignOptions = {
  secret: string | Secret;
  expiresIn?: StringValue;
  algorithm?: Algorithm;
  exp?: number;
};

const TOKEN_CONFIG: Record<ETokenType, SignOptions> = {
  [ETokenType.ACCESS_TOKEN]: {
    secret: config.jwt.accessTokenSecret,
    expiresIn: config.jwt.accessTokenExpiresIn,
    algorithm: config.jwt.algorithm
  },
  [ETokenType.REFRESH_TOKEN]: {
    secret: config.jwt.refreshTokenSecret,
    expiresIn: config.jwt.refreshTokenExpiresIn,
    algorithm: config.jwt.algorithm
  },
  [ETokenType.EMAIL_VERIFICATION_TOKEN]: {
    secret: config.jwt.emailTokenSecret,
    expiresIn: config.jwt.emailTokenExpiresIn,
    algorithm: config.jwt.algorithm
  },
  [ETokenType.FORGOT_PASSWORD_TOKEN]: {
    secret: config.jwt.forgotPasswordTokenSecret,
    expiresIn: config.jwt.forgotPasswordTokenExpiresIn,
    algorithm: config.jwt.algorithm
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

export class TokenService implements ITokenService {
  constructor() {}

  private signTokenSync(params: TokenSignParams, tokenConfig: SignOptions): string {
    // Add a uuid for uniqueness
    const { userId, type, exp } = params;
    const payload: Record<string, string | number> = { uuid: uuidv4(), userId, type };
    if (typeof exp === 'number') payload.exp = exp;

    const options: jwt.SignOptions = {
      algorithm: tokenConfig.algorithm
    };
    if (!exp && tokenConfig.expiresIn) options.expiresIn = tokenConfig.expiresIn;

    return jwt.sign(payload, tokenConfig.secret, options);
  }

  private signToken(params: TokenSignParams, tokenConfig: SignOptions): Promise<string> {
    return Promise.resolve(this.signTokenSync(params, tokenConfig));
  }

  private verifyTokenSync<T>(token: string, tokenConfig: SignOptions): T {
    const algorithms = tokenConfig.algorithm ? [tokenConfig.algorithm] : undefined;
    return jwt.verify(token, tokenConfig.secret, algorithms ? { algorithms } : {}) as T;
  }

  private verifyToken<T>(token: string, tokenConfig: SignOptions): Promise<T> {
    const algorithms = tokenConfig.algorithm ? [tokenConfig.algorithm] : undefined;
    return new Promise((resolve, reject) => {
      jwt.verify(token, tokenConfig.secret, algorithms ? { algorithms } : {}, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded as T);
      });
    });
  }

  // Access Token
  signAccessToken({ userId, type }: TokenPayloadCreate): Promise<string> {
    return this.signToken({ userId, type }, TOKEN_CONFIG[ETokenType.ACCESS_TOKEN]);
  }
  signAccessTokenSync({ userId, type }: TokenPayloadCreate): string {
    return this.signTokenSync({ userId, type }, TOKEN_CONFIG[ETokenType.ACCESS_TOKEN]);
  }
  verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.verifyToken<TokenPayload>(token, TOKEN_CONFIG[ETokenType.ACCESS_TOKEN]);
  }
  verifyAccessTokenSync(token: string): TokenPayload {
    return this.verifyTokenSync<TokenPayload>(token, TOKEN_CONFIG[ETokenType.ACCESS_TOKEN]);
  }

  // Refresh Token
  signRefreshToken({ userId, type, exp }: TokenPayloadCreate & { exp?: number }): Promise<string> {
    return this.signToken({ userId, type, exp }, TOKEN_CONFIG[ETokenType.REFRESH_TOKEN]);
  }
  signRefreshTokenSync({ userId, type, exp }: TokenPayloadCreate & { exp?: number }): string {
    return this.signTokenSync({ userId, type, exp }, TOKEN_CONFIG[ETokenType.REFRESH_TOKEN]);
  }
  verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.verifyToken<TokenPayload>(token, TOKEN_CONFIG[ETokenType.REFRESH_TOKEN]);
  }
  verifyRefreshTokenSync(token: string): TokenPayload {
    return this.verifyTokenSync<TokenPayload>(token, TOKEN_CONFIG[ETokenType.REFRESH_TOKEN]);
  }

  // Email Verification Token
  signEmailVerificationToken({ userId, type }: TokenPayloadCreate): Promise<string> {
    return this.signToken({ userId, type }, TOKEN_CONFIG[ETokenType.EMAIL_VERIFICATION_TOKEN]);
  }
  signEmailVerificationTokenSync({ userId, type }: TokenPayloadCreate): string {
    return this.signTokenSync({ userId, type }, TOKEN_CONFIG[ETokenType.EMAIL_VERIFICATION_TOKEN]);
  }
  verifyEmailVerificationToken(token: string): Promise<TokenPayload> {
    return this.verifyToken<TokenPayload>(token, TOKEN_CONFIG[ETokenType.EMAIL_VERIFICATION_TOKEN]);
  }
  verifyEmailVerificationTokenSync(token: string): TokenPayload {
    return this.verifyTokenSync<TokenPayload>(token, TOKEN_CONFIG[ETokenType.EMAIL_VERIFICATION_TOKEN]);
  }

  // Forgot Password Token
  signForgotPasswordToken({ userId, type }: TokenPayloadCreate): Promise<string> {
    return this.signToken({ userId, type }, TOKEN_CONFIG[ETokenType.FORGOT_PASSWORD_TOKEN]);
  }
  signForgotPasswordTokenSync({ userId, type }: TokenPayloadCreate): string {
    return this.signTokenSync({ userId, type }, TOKEN_CONFIG[ETokenType.FORGOT_PASSWORD_TOKEN]);
  }
  verifyForgotPasswordToken(token: string): Promise<TokenPayload> {
    return this.verifyToken<TokenPayload>(token, TOKEN_CONFIG[ETokenType.FORGOT_PASSWORD_TOKEN]);
  }
  verifyForgotPasswordTokenSync(token: string): TokenPayload {
    return this.verifyTokenSync<TokenPayload>(token, TOKEN_CONFIG[ETokenType.FORGOT_PASSWORD_TOKEN]);
  }
}
