import { envConfig } from '@/bootstrap/config/env.config';
import { GetGoogleAuthUrlPort } from '@/modules/auth/application/use-cases/get-google-auth-url/get-google-auth-url.port';
import { LoginGooglePort } from '@/modules/auth/application/use-cases/login-google/login-google.port';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  refreshTokenCookieSharedOptions,
  refreshTokenMaxAgeMs
} from '@/presentation/http/express/constants/auth.constant';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import {
  GetGoogleAuthUrlQueryDTO,
  OAuthGoogleLoginQueryDTO
} from '@/presentation/http/express/v1/dtos/oauth/oauth.request.dto';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IOAuthController {
  getGoogleAuthUrl(req: Request<ParamsDictionary, object, object, GetGoogleAuthUrlQueryDTO>): void;
  googleLogin(
    req: Request<ParamsDictionary, object, object, OAuthGoogleLoginQueryDTO>,
    res: Response
  ): Promise<unknown>;
}

export class OAuthController extends BaseController implements IOAuthController {
  constructor(
    private readonly getGoogleAuthUrlUC: GetGoogleAuthUrlPort,
    private readonly googleLoginUC: LoginGooglePort
  ) {
    super();
  }

  @AutoBind()
  getGoogleAuthUrl(req: Request<ParamsDictionary, object, object, GetGoogleAuthUrlQueryDTO>) {
    const { ip, userAgent } = req.query;
    const url = this.getGoogleAuthUrlUC.execute({ ip, userAgent });
    return this.response<string>({
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
