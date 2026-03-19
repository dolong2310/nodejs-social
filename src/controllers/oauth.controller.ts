import { envConfig } from '@/config';
import { BaseController } from '@/controllers/base.controller';
import { IOAuthGoogleLoginRequestQuery } from '@/models/requests/oauth.request';
import { IOAuthService } from '@/services/oauth.service';
import { Request, Response } from 'express';

export interface IOAuthController {
  googleLogin(req: Request<{}, {}, {}, IOAuthGoogleLoginRequestQuery>, res: Response): Promise<void>;
}

class OAuthController extends BaseController implements IOAuthController {
  constructor(private readonly oauthService: IOAuthService) {
    super();
  }

  googleLogin = async (req: Request<{}, {}, {}, IOAuthGoogleLoginRequestQuery>, res: Response) => {
    const { accessToken, refreshToken } = await this.oauthService.googleLogin(req.query);

    return res.redirect(
      `${envConfig.FRONTEND_URL}/oauth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  };
}

export default OAuthController;
