import { envConfig } from '@/config';
import { BaseController } from '@/controllers/base.controller';
import { OAuthGoogleLoginQueryDTO } from '@/dtos/requests/oauth.request.dto';
import { IOAuthService } from '@/services/oauth.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IOAuthController {
  googleLogin(req: Request<ParamsDictionary, object, object, OAuthGoogleLoginQueryDTO>, res: Response): Promise<void>;
}

class OAuthController extends BaseController implements IOAuthController {
  constructor(private readonly oauthService: IOAuthService) {
    super();
  }

  googleLogin = async (req: Request<ParamsDictionary, object, object, OAuthGoogleLoginQueryDTO>, res: Response) => {
    const { accessToken, refreshToken } = await this.oauthService.googleLogin(req.query);

    return res.redirect(
      `${envConfig.GOOGLE_REDIRECT_URI}/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  };
}

export default OAuthController;
