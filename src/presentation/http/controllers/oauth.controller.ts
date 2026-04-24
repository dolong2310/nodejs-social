import { GetGoogleAuthUrlInPort } from '@/application/use-cases/auth/get-google-auth-url/get-google-auth-url.in-port';
import { LoginGoogleInPort } from '@/application/use-cases/auth/login-google/login-google.in-port';
import { envConfig } from '@/bootstrap/config/env.config';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  refreshTokenCookieSharedOptions,
  refreshTokenMaxAgeMs
} from '@/presentation/http/constants/auth.constant';
import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { GetGoogleAuthUrlQueryDTO, OAuthGoogleLoginQueryDTO } from '@/presentation/http/dtos/oauth/oauth.request.dto';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IOAuthController {
  getGoogleAuthUrl(req: Request<ParamsDictionary, object, object, GetGoogleAuthUrlQueryDTO>, res: Response): void;
  googleLogin(req: Request<ParamsDictionary, object, object, OAuthGoogleLoginQueryDTO>, res: Response): Promise<void>;
}

export class OAuthController extends BaseController implements IOAuthController {
  constructor(
    private readonly getGoogleAuthUrlUC: GetGoogleAuthUrlInPort,
    private readonly googleLoginUC: LoginGoogleInPort
  ) {
    super();
  }

  @AutoBind()
  getGoogleAuthUrl(req: Request<ParamsDictionary, object, object, GetGoogleAuthUrlQueryDTO>, res: Response) {
    const { ip, userAgent } = req.query;
    const url = this.getGoogleAuthUrlUC.execute({ ip, userAgent });
    this.sendResponse<string>({
      res,
      data: url,
      message: 'Get authorization url successfully'
    });
  }

  @AutoBind()
  async googleLogin(req: Request<ParamsDictionary, object, object, OAuthGoogleLoginQueryDTO>, res: Response) {
    const { state, code } = req.query;
    const { refreshToken } = await this.googleLoginUC.execute({ state, code });

    this.setCookie(res, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      ...refreshTokenCookieSharedOptions,
      maxAge: refreshTokenMaxAgeMs(refreshToken)
    });

    // After redirect, client will call /auth/refresh-token to get accessToken
    return res.redirect(`${envConfig.FRONTEND_URL}/oauth/google/callback`);
  }
}
