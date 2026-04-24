import { IJwtService } from '@/application/ports/jwt.port';
import {
  AccessTokenPayload,
  AccessTokenPayloadCreate,
  ITokenService,
  RefreshTokenPayload,
  RefreshTokenPayloadCreate
} from '@/application/services/token/token.service.type';
import { IAppConfig } from '@/bootstrap/types/app.type';
import { v4 as uuidv4 } from 'uuid';

export class TokenService implements ITokenService {
  constructor(
    private readonly jwtService: IJwtService,
    private readonly appConfig: IAppConfig
  ) {}

  signAccessToken(payload: AccessTokenPayloadCreate): Promise<string> {
    // thêm uuid để tránh trường hợp 2 request cùng payload được gọi cùng 1 thời điểm thì sẽ bị trùng jwt token
    // thêm uuid để tạo khác biệt giữa 2 jwt token
    return this.jwtService.signAsync(
      { ...payload, uuid: uuidv4() },
      {
        secret: this.appConfig.jwt.accessTokenSecret,
        expiresIn: this.appConfig.jwt.accessTokenExpiresIn,
        algorithm: 'HS256'
      }
    );
  }

  signRefreshToken(payload: RefreshTokenPayloadCreate): Promise<string> {
    // thêm uuid để tránh trường hợp 2 request cùng payload được gọi cùng 1 thời điểm thì sẽ bị trùng jwt token
    // thêm uuid để tạo khác biệt giữa 2 jwt token
    return this.jwtService.signAsync(
      { ...payload, uuid: uuidv4() },
      {
        secret: this.appConfig.jwt.refreshTokenSecret,
        expiresIn: this.appConfig.jwt.refreshTokenExpiresIn,
        algorithm: 'HS256'
      }
    );
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwtService.verifyAsync<AccessTokenPayload>(token, {
      secret: this.appConfig.jwt.accessTokenSecret
    });
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
      secret: this.appConfig.jwt.refreshTokenSecret
    });
  }
}
