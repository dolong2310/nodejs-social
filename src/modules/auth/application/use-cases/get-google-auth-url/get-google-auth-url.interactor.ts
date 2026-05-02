import { IGoogleOAuthService } from '@/modules/core/application/ports/google-oauth.out-port';
import {
  GetGoogleAuthUrlCommand,
  GetGoogleAuthUrlInPort
} from '@/modules/auth/application/use-cases/get-google-auth-url/get-google-auth-url.in-port';

export class GetGoogleAuthUrlInteractor extends GetGoogleAuthUrlInPort {
  constructor(private readonly googleOAuthService: IGoogleOAuthService) {
    super();
  }

  execute({ ip, userAgent }: GetGoogleAuthUrlCommand): string {
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
}
