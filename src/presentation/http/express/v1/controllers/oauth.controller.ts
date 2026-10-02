import { envConfig } from '@/bootstrap/config/env.config';
import type { GetGoogleAuthUrlPort } from '@/modules/authentication/application/use-cases/get-google-auth-url/get-google-auth-url.port';
import type { LoginGooglePort } from '@/modules/authentication/application/use-cases/login-google/login-google.port';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  refreshTokenCookieSharedOptions,
  refreshTokenMaxAgeMs
} from '@/presentation/http/express/constants/auth.constants';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import type { ExpressResponse, ValidatedRequest } from '@/presentation/http/express/types';
import type {
  GoogleAuthUrlQuerySchema,
  GoogleLoginQuerySchema
} from '@/presentation/http/express/v1/schemas/oauth/oauth.request.schema';

type GoogleAuthUrlRequest = ValidatedRequest<{ query: typeof GoogleAuthUrlQuerySchema }>;
type GoogleLoginRequest = ValidatedRequest<{ query: typeof GoogleLoginQuerySchema }>;

export interface IOAuthController {
  getGoogleAuthUrl(req: GoogleAuthUrlRequest): unknown;
  googleLogin(req: GoogleLoginRequest, res: ExpressResponse): Promise<unknown>;
}

export class OAuthController extends BaseController implements IOAuthController {
  constructor(
    private readonly getGoogleAuthUrlUC: GetGoogleAuthUrlPort,
    private readonly googleLoginUC: LoginGooglePort
  ) {
    super();
  }

  @AutoBind()
  getGoogleAuthUrl(req: GoogleAuthUrlRequest) {
    const { ip, userAgent } = req.query;
    const url = this.getGoogleAuthUrlUC.execute({ ip, userAgent });
    return this.response<string>({
      data: url,
      message: 'Get authorization url successfully'
    });
  }

  @AutoBind()
  async googleLogin(req: GoogleLoginRequest, res: ExpressResponse) {
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
