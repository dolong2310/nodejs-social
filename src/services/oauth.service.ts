import { envConfig } from '@/config';
import { RegisterRequestDTO } from '@/dtos/requests/auth.request.dto';
import { GetGoogleAuthUrlQueryDTO, OAuthGoogleLoginQueryDTO } from '@/dtos/requests/oauth.request.dto';
import { OAuthGoogleLoginResponseDTO } from '@/dtos/responses/oauth.response.dto';
import { BadRequestError } from '@/responses/error.response';
import { IAuthService } from '@/services/auth.service';
import { IUsersService } from '@/services/users.service';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

export interface IOAuthService {
  getGoogleAuthUrl(query: GetGoogleAuthUrlQueryDTO): string;
  googleLogin(query: OAuthGoogleLoginQueryDTO): Promise<OAuthGoogleLoginResponseDTO>;
}

class OAuthService implements IOAuthService {
  private oauth2Client: OAuth2Client;

  constructor(
    private readonly authService: IAuthService,
    private readonly usersService: IUsersService
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      envConfig.GOOGLE_CLIENT_ID,
      envConfig.GOOGLE_CLIENT_SECRET,
      envConfig.GOOGLE_REDIRECT_URI
    );
  }

  getGoogleAuthUrl({ ip, userAgent }: GetGoogleAuthUrlQueryDTO): string {
    // Scope là các quyền mà chúng ta cần để lấy thông tin từ Google
    const scope = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    // State là dữ liệu mà chúng ta muốn gửi đi khi redirect về browser client
    // Tại sao ngoài JSON.stringify lại còn thêm Buffer.from()?
    // Vì JSON.stringify() sẽ trả về một chuỗi JSON, nhưng chuỗi JSON này có thể chứa các ký tự đặc biệt
    // Ví dụ: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    // Khi đó, chuỗi JSON này sẽ không thể được sử dụng trong URL
    // Vì vậy, chúng ta cần phải chuyển đổi chuỗi JSON thành base64
    // Base64 là một chuỗi chỉ chứa các ký tự a-z, A-Z, 0-9, +, / và =
    // Và chuỗi base64 này sẽ không chứa các ký tự đặc biệt
    const state = Buffer.from(JSON.stringify({ ip, userAgent })).toString('base64');

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // offline access -> chúng ta cần lấy refresh token
      include_granted_scopes: true, // include granted scopes -> chúng ta cần lấy quyền mà người dùng đã cho phép
      prompt: 'select_account', // Luôn hiện màn hình chọn tài khoản Google; mặc định Google dùng session trình duyệt và bỏ qua bước này
      scope,
      state // state là dữ liệu mà chúng ta muốn gửi đi khi redirect về browser client
    });

    return url;
  }

  async googleLogin({ code }: OAuthGoogleLoginQueryDTO): Promise<OAuthGoogleLoginResponseDTO> {
    // 1. Get ip and userAgent from state
    // let ip = 'Unknown';
    // let userAgent = 'Unknown';

    // try {
    //   const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8')) as { ip: string; userAgent: string };
    //   ip = stateData.ip;
    //   userAgent = stateData.userAgent;
    // } catch (error) {
    //   console.log('error parsing state: ', error);
    // }

    // 2. Get token info from code
    const { tokens } = await this.oauth2Client.getToken(code);

    // 2.1 set credentials
    this.oauth2Client.setCredentials(tokens); // set credentials to oauth2Client (tokens bao gồm các access token, refresh token, ... để xác thực với google)

    // 3. Get user info from google
    const oauth2 = google.oauth2({ auth: this.oauth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();

    // 3.1 Check if email is verified
    if (!data.verified_email || !data.email) {
      throw new BadRequestError('Google account is not verified');
    }

    // check user exists
    const user = await this.usersService.findUserByEmail(data.email);

    // if user exists, login
    if (user) {
      const tokens = await this.authService.createAuthSession(user);
      return tokens;
    }
    // else, register
    const randomPassword = uuidv4();
    return await this.authService.register(
      new RegisterRequestDTO({
        name: data.name ?? '',
        email: data.email,
        password: randomPassword,
        dateOfBirth: new Date().toISOString()
      }),
      { autoLogin: true }
    );
  }

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

  async googleLoginV1({ code }: OAuthGoogleLoginQueryDTO): Promise<OAuthGoogleLoginResponseDTO> {
    const token = await this.getOAuthGoogleToken(code);
    const userInfo = await this.getOAuthGoogleUser(token.access_token, token.id_token);

    if (!userInfo.verified_email) {
      throw new BadRequestError('Google account is not verified');
    }

    // check user exists
    const user = await this.usersService.findUserByEmail(userInfo.email);

    // if user exists, login
    if (user) {
      const tokens = await this.authService.createAuthSession(user);
      return tokens;
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
