import { envConfig } from '@/config';
import { BaseController } from '@/controllers/base.controller';
import { IOAuthService } from '@/services/oauth.service';
import { Request, Response } from 'express';

export interface IOAuthController {
  googleLogin(req: Request, res: Response): Promise<void>;
}

class OAuthController extends BaseController implements IOAuthController {
  constructor(private readonly oauthService: IOAuthService) {
    super();
  }

  async googleLogin(req: Request, res: Response) {
    const { state, code } = req.query;

    const { accessToken, refreshToken } = await this.oauthService.googleLogin(state as string, code as string);

    return res.redirect(
      `${envConfig.FRONTEND_URL}/oauth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }
}

export default OAuthController;
