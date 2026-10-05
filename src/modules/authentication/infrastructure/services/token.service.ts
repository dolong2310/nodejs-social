import {
  ExpiredTokenException,
  InvalidTokenException
} from '@/modules/authentication/application/exceptions/auth.exception';
import type {
  AccessTokenPayload,
  AccessTokenPayloadCreate,
  RefreshTokenPayload,
  RefreshTokenPayloadCreate,
  TokenServicePort
} from '@/modules/authentication/application/ports/token.port';
import type { JwtPort } from '@/modules/authentication/infrastructure/services/jwt.service';
import jwt, { type Algorithm, type Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';

export type TokenServiceConfig = {
  algorithm: Algorithm;
  accessTokenSecret: Secret;
  refreshTokenSecret: Secret;
  accessTokenExpiresIn: StringValue;
  refreshTokenExpiresIn: StringValue;
};

/** JWT implementation of TokenServicePort. */
export class TokenService implements TokenServicePort {
  constructor(
    private readonly jwtService: JwtPort,
    private readonly tokenConfig: TokenServiceConfig
  ) {}

  signAccessToken(payload: AccessTokenPayloadCreate): Promise<string> {
    // Add uuid so two requests with the same payload at the same time do not produce duplicate JWTs.
    // The uuid makes the two JWTs distinct.
    return this.jwtService.signAsync(
      { ...payload, uuid: uuidv4() },
      {
        secret: this.tokenConfig.accessTokenSecret,
        expiresIn: this.tokenConfig.accessTokenExpiresIn,
        algorithm: this.tokenConfig.algorithm
      }
    );
  }

  signRefreshToken(payload: RefreshTokenPayloadCreate): Promise<string> {
    // Add uuid so two requests with the same payload at the same time do not produce duplicate JWTs.
    // The uuid makes the two JWTs distinct.
    return this.jwtService.signAsync(
      { ...payload, uuid: uuidv4() },
      {
        secret: this.tokenConfig.refreshTokenSecret,
        expiresIn: this.tokenConfig.refreshTokenExpiresIn,
        algorithm: this.tokenConfig.algorithm
      }
    );
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.verify<AccessTokenPayload>(token, this.tokenConfig.accessTokenSecret);
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.verify<RefreshTokenPayload>(token, this.tokenConfig.refreshTokenSecret);
  }

  // Translate jsonwebtoken errors into the errors promised by TokenServicePort.
  private async verify<T extends object>(token: string, secret: Secret): Promise<T> {
    try {
      return await this.jwtService.verifyAsync<T>(token, { secret });
    } catch (error) {
      // TokenExpiredError extends JsonWebTokenError, so it must be checked first.
      if (error instanceof jwt.TokenExpiredError) throw new ExpiredTokenException();
      if (error instanceof jwt.JsonWebTokenError) throw new InvalidTokenException();
      throw error;
    }
  }
}
