import { ETokenType } from '@/domain/enums/token.enum';
import { TokenPayload, TokenPayloadCreate } from '@/domain/value-objects/token.value-object';

import { ITokenService } from '@/application/ports/token.port';

import { IAppConfig } from '@/bootstrap/types/app.type';

import jwt, { type Algorithm, type Secret } from 'jsonwebtoken'; // TODO: application should not depend on infrastructure
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

export class TokenService implements ITokenService {
  private readonly tokenConfig: Record<ETokenType, SignOptions>;

  // TODO: need to inject appConfig from container
  constructor(private readonly appConfig: IAppConfig) {
    this.tokenConfig = {
      [ETokenType.ACCESS_TOKEN]: {
        secret: this.appConfig.jwt.accessTokenSecret,
        expiresIn: this.appConfig.jwt.accessTokenExpiresIn,
        algorithm: this.appConfig.jwt.algorithm
      },
      [ETokenType.REFRESH_TOKEN]: {
        secret: this.appConfig.jwt.refreshTokenSecret,
        expiresIn: this.appConfig.jwt.refreshTokenExpiresIn,
        algorithm: this.appConfig.jwt.algorithm
      },
      [ETokenType.EMAIL_VERIFICATION_TOKEN]: {
        secret: this.appConfig.jwt.emailTokenSecret,
        expiresIn: this.appConfig.jwt.emailTokenExpiresIn,
        algorithm: this.appConfig.jwt.algorithm
      },
      [ETokenType.FORGOT_PASSWORD_TOKEN]: {
        secret: this.appConfig.jwt.forgotPasswordTokenSecret,
        expiresIn: this.appConfig.jwt.forgotPasswordTokenExpiresIn,
        algorithm: this.appConfig.jwt.algorithm
      }
    };
  }

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
    return this.signToken({ userId, type }, this.tokenConfig[ETokenType.ACCESS_TOKEN]);
  }
  signAccessTokenSync({ userId, type }: TokenPayloadCreate): string {
    return this.signTokenSync({ userId, type }, this.tokenConfig[ETokenType.ACCESS_TOKEN]);
  }
  verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.verifyToken<TokenPayload>(token, this.tokenConfig[ETokenType.ACCESS_TOKEN]);
  }
  verifyAccessTokenSync(token: string): TokenPayload {
    return this.verifyTokenSync<TokenPayload>(token, this.tokenConfig[ETokenType.ACCESS_TOKEN]);
  }

  // Refresh Token
  signRefreshToken({ userId, type, exp }: TokenPayloadCreate & { exp?: number }): Promise<string> {
    return this.signToken({ userId, type, exp }, this.tokenConfig[ETokenType.REFRESH_TOKEN]);
  }
  signRefreshTokenSync({ userId, type, exp }: TokenPayloadCreate & { exp?: number }): string {
    return this.signTokenSync({ userId, type, exp }, this.tokenConfig[ETokenType.REFRESH_TOKEN]);
  }
  verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.verifyToken<TokenPayload>(token, this.tokenConfig[ETokenType.REFRESH_TOKEN]);
  }
  verifyRefreshTokenSync(token: string): TokenPayload {
    return this.verifyTokenSync<TokenPayload>(token, this.tokenConfig[ETokenType.REFRESH_TOKEN]);
  }

  // Email Verification Token
  signEmailVerificationToken({ userId, type }: TokenPayloadCreate): Promise<string> {
    return this.signToken({ userId, type }, this.tokenConfig[ETokenType.EMAIL_VERIFICATION_TOKEN]);
  }
  signEmailVerificationTokenSync({ userId, type }: TokenPayloadCreate): string {
    return this.signTokenSync({ userId, type }, this.tokenConfig[ETokenType.EMAIL_VERIFICATION_TOKEN]);
  }
  verifyEmailVerificationToken(token: string): Promise<TokenPayload> {
    return this.verifyToken<TokenPayload>(token, this.tokenConfig[ETokenType.EMAIL_VERIFICATION_TOKEN]);
  }
  verifyEmailVerificationTokenSync(token: string): TokenPayload {
    return this.verifyTokenSync<TokenPayload>(token, this.tokenConfig[ETokenType.EMAIL_VERIFICATION_TOKEN]);
  }

  // Forgot Password Token
  signForgotPasswordToken({ userId, type }: TokenPayloadCreate): Promise<string> {
    return this.signToken({ userId, type }, this.tokenConfig[ETokenType.FORGOT_PASSWORD_TOKEN]);
  }
  signForgotPasswordTokenSync({ userId, type }: TokenPayloadCreate): string {
    return this.signTokenSync({ userId, type }, this.tokenConfig[ETokenType.FORGOT_PASSWORD_TOKEN]);
  }
  verifyForgotPasswordToken(token: string): Promise<TokenPayload> {
    return this.verifyToken<TokenPayload>(token, this.tokenConfig[ETokenType.FORGOT_PASSWORD_TOKEN]);
  }
  verifyForgotPasswordTokenSync(token: string): TokenPayload {
    return this.verifyTokenSync<TokenPayload>(token, this.tokenConfig[ETokenType.FORGOT_PASSWORD_TOKEN]);
  }
}
