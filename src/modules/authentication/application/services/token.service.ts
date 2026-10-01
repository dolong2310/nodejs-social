import type { JwtPort } from '@/modules/authentication/application/ports/jwt.port';
import type {
  AccessTokenPayload,
  AccessTokenPayloadCreate,
  RefreshTokenPayload,
  RefreshTokenPayloadCreate,
  TokenServiceConfig,
  TokenServicePort
} from '@/modules/authentication/application/services/token.service.types';
import { v4 as uuidv4 } from 'uuid';

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
    return this.jwtService.verifyAsync<AccessTokenPayload>(token, {
      secret: this.tokenConfig.accessTokenSecret
    });
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
      secret: this.tokenConfig.refreshTokenSecret
    });
  }
}
