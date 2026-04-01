import { envConfig } from '@/config/envConfig';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  refreshTokenCookieSharedOptions,
  refreshTokenMaxAgeMs
} from '@/constants/auth.constant';
import { AutoBind } from '@/decorators';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseController } from '@/modules/base/base.controller';
import { GetGoogleAuthUrlQueryDTO, OAuthGoogleLoginQueryDTO } from '@/modules/oauth/dtos/oauth.request.dto';
import { OAuthService } from '@/modules/oauth/oauth.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IOAuthController {
  getGoogleAuthUrl(req: Request<ParamsDictionary, object, object, GetGoogleAuthUrlQueryDTO>, res: Response): void;
  googleLogin(req: Request<ParamsDictionary, object, object, OAuthGoogleLoginQueryDTO>, res: Response): Promise<void>;
}

@Injectable()
export class OAuthController extends BaseController implements IOAuthController {
  constructor(private readonly oauthService: OAuthService) {
    super();
  }

  @AutoBind()
  getGoogleAuthUrl(req: Request<ParamsDictionary, object, object, GetGoogleAuthUrlQueryDTO>, res: Response) {
    const { ip, userAgent } = req.query;
    const url = this.oauthService.getGoogleAuthUrl({ ip, userAgent });
    this.sendResponse<string>({
      res,
      data: url,
      message: 'Get authorization url successfully'
    });
  }

  @AutoBind()
  async googleLogin(req: Request<ParamsDictionary, object, object, OAuthGoogleLoginQueryDTO>, res: Response) {
    const { refreshToken } = await this.oauthService.googleLogin(req.query);

    this.setCookie(res, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      ...refreshTokenCookieSharedOptions,
      maxAge: refreshTokenMaxAgeMs(refreshToken)
    });

    // After redirect, client will call /auth/refresh-token to get accessToken
    return res.redirect(`${envConfig.FRONTEND_URL}/oauth/google/callback`);
  }
}
