import { envConfig } from '@/config';
import { REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieSharedOptions, refreshTokenMaxAgeMs } from '@/constants';
import { Injectable } from '@/decorators';
import { BaseController, GetGoogleAuthUrlQueryDTO, OAuthGoogleLoginQueryDTO, OAuthService } from '@/modules';
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

  getGoogleAuthUrl = (req: Request<ParamsDictionary, object, object, GetGoogleAuthUrlQueryDTO>, res: Response) => {
    const { ip, userAgent } = req.query;
    const url = this.oauthService.getGoogleAuthUrl({ ip, userAgent });
    this.sendResponse<string>({
      res,
      data: url,
      message: 'Get authorization url successfully'
    });
  };

  googleLogin = async (req: Request<ParamsDictionary, object, object, OAuthGoogleLoginQueryDTO>, res: Response) => {
    const { refreshToken } = await this.oauthService.googleLogin(req.query);

    this.setCookie(res, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      ...refreshTokenCookieSharedOptions,
      maxAge: refreshTokenMaxAgeMs(refreshToken)
    });

    // After redirect, client will call /auth/refresh-token to get accessToken
    return res.redirect(`${envConfig.FRONTEND_URL}/oauth/google/callback`);
  };
}
