import { JwtPort } from '@/modules/authentication/application/ports/jwt.port';
import {
  AccessTokenPayload,
  AccessTokenPayloadCreate,
  RefreshTokenPayload,
  RefreshTokenPayloadCreate,
  TokenServiceConfig,
  TokenServicePort
} from '@/modules/authentication/application/services/token.service.type';
import { v4 as uuidv4 } from 'uuid';

export class TokenService implements TokenServicePort {
  constructor(
    private readonly jwtService: JwtPort,
    private readonly tokenConfig: TokenServiceConfig
  ) {}

  signAccessToken(payload: AccessTokenPayloadCreate): Promise<string> {
    // thêm uuid để tránh trường hợp 2 request cùng payload được gọi cùng 1 thời điểm thì sẽ bị trùng jwt token
    // thêm uuid để tạo khác biệt giữa 2 jwt token
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
    // thêm uuid để tránh trường hợp 2 request cùng payload được gọi cùng 1 thời điểm thì sẽ bị trùng jwt token
    // thêm uuid để tạo khác biệt giữa 2 jwt token
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
