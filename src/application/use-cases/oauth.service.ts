import { GetGoogleAuthUrlPayloadDTO, OAuthGoogleLoginPayloadDTO } from '@/application/dtos/oauth/oauth.payload.dto';
import { OAuthGoogleLoginResultDTO } from '@/application/dtos/oauth/oauth.result.dto';
import { GoogleAccountNotVerifiedException } from '@/application/errors/oauth.error';
import { IAuthService } from '@/application/ports/auth.port';
import { IGoogleOAuthService } from '@/application/ports/google-oauth.port';
import { IOAuthService } from '@/application/ports/oauth.port';
import { IUsersService } from '@/application/ports/user.port';

import { v4 as uuidv4 } from 'uuid';

export class OAuthService implements IOAuthService {
  constructor(
    private readonly googleOAuthService: IGoogleOAuthService,
    private readonly authService: IAuthService,
    private readonly usersService: IUsersService
  ) {}

  public getGoogleAuthUrl({ ip, userAgent }: GetGoogleAuthUrlPayloadDTO): string {
    const scope = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const state = Buffer.from(JSON.stringify({ ip, userAgent })).toString('base64');

    return this.googleOAuthService.generateAuthUrl({
      state,
      scope
    });
  }

  public async googleLogin({ code }: OAuthGoogleLoginPayloadDTO): Promise<OAuthGoogleLoginResultDTO> {
    const userInfo = await this.googleOAuthService.getUserInfoFromCode(code);

    if (!userInfo.verifiedEmail || !userInfo.email) {
      throw GoogleAccountNotVerifiedException;
    }

    const user = await this.usersService.findUserByEmail({ email: userInfo.email });

    if (user) {
      const authSession = await this.authService.createAuthSession({ userId: user.id });
      return new OAuthGoogleLoginResultDTO(authSession);
    }

    const randomPassword = uuidv4();

    const authSession = await this.authService.register(
      {
        name: userInfo.name,
        email: userInfo.email,
        password: randomPassword,
        dateOfBirth: new Date().toISOString()
      },
      { autoLogin: true }
    );
    return new OAuthGoogleLoginResultDTO(authSession);
  }
}
