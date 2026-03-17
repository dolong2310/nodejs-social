import { BadRequestError } from '@/models/error.response';
import authService from '@/services/auth.service';
import usersService from '@/services/users.service';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

class OAuthService {
  constructor() {}

  private async getOAuthGoogleToken(code: string): Promise<{ access_token: string; id_token: string }> {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    };

    const response = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  }

  private async getOAuthGoogleUser(
    accessToken: string,
    idToken: string
  ): Promise<{
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
  }> {
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${idToken}`
      },
      params: {
        access_token: accessToken,
        alt: 'json'
      }
    });
    return response.data;
  }

  async googleLogin(state: string, code: string) {
    const token = await this.getOAuthGoogleToken(code);
    const userInfo = await this.getOAuthGoogleUser(token.access_token, token.id_token);

    if (!userInfo.verified_email) {
      throw new BadRequestError('Google account is not verified');
    }

    // check user exists
    const user = await usersService.findUserByEmail(userInfo.email);

    // if user exists, login
    if (user) {
      const { accessToken, refreshToken } = await authService.login(
        { email: userInfo.email, password: user.password },
        user
      );
      return { accessToken, refreshToken };
    }
    // else, register
    const randomPassword = uuidv4();
    return await authService.register(
      {
        name: userInfo.name,
        email: userInfo.email,
        password: randomPassword,
        dateOfBirth: new Date().toISOString()
      },
      {
        autoLogin: true
      }
    );

    // const { accessToken, refreshToken } = await authService.login(
    //   { email: userInfo.email, password: newUser.password },
    //   newUser
    // );
    // return { accessToken, refreshToken };
  }
}

export default new OAuthService();
