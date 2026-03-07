import oauthService from '@/services/oauth.service';
import dotenv from 'dotenv';
import { Request, Response } from 'express';

dotenv.config();

class OAuthController {
  constructor() {}

  async googleLogin(req: Request, res: Response) {
    const { state, code } = req.query;

    const { accessToken, refreshToken } = await oauthService.googleLogin(state as string, code as string);

    return res.redirect(
      `${process.env.FRONTEND_URL}/oauth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }
}

export default new OAuthController();
