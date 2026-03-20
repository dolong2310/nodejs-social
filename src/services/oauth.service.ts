import { envConfig } from '@/config';
import { RegisterRequestDTO } from '@/dtos/requests/auth.request.dto';
import { OAuthGoogleLoginQueryDTO } from '@/dtos/requests/oauth.request.dto';
import { OAuthGoogleLoginResponseDTO } from '@/dtos/responses/oauth.response.dto';
import { BadRequestError } from '@/responses/error.response';
import { IAuthService } from '@/services/auth.service';
import { IUsersService } from '@/services/users.service';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface IOAuthService {
  googleLogin(query: OAuthGoogleLoginQueryDTO): Promise<OAuthGoogleLoginResponseDTO>;
}

class OAuthService implements IOAuthService {
  constructor(
    private readonly authService: IAuthService,
    private readonly usersService: IUsersService
  ) {}

  private async getOAuthGoogleToken(code: string): Promise<{ access_token: string; id_token: string }> {
    const body = {
      code,
      client_id: envConfig.GOOGLE_CLIENT_ID,
      client_secret: envConfig.GOOGLE_CLIENT_SECRET,
      redirect_uri: envConfig.GOOGLE_REDIRECT_URI,
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

  async googleLogin({ code }: OAuthGoogleLoginQueryDTO): Promise<OAuthGoogleLoginResponseDTO> {
    const token = await this.getOAuthGoogleToken(code);
    const userInfo = await this.getOAuthGoogleUser(token.access_token, token.id_token);

    if (!userInfo.verified_email) {
      throw new BadRequestError('Google account is not verified');
    }

    // check user exists
    const user = await this.usersService.findUserByEmail(userInfo.email);

    // if user exists, login
    if (user) {
      const { accessToken, refreshToken } = await this.authService.login(
        { email: userInfo.email, password: user.password },
        user
      );
      return { accessToken, refreshToken };
    }
    // else, register
    const randomPassword = uuidv4();
    return await this.authService.register(
      new RegisterRequestDTO({
        name: userInfo.name,
        email: userInfo.email,
        password: randomPassword,
        dateOfBirth: new Date().toISOString()
      }),
      { autoLogin: true }
    );
  }
}

export default OAuthService;
