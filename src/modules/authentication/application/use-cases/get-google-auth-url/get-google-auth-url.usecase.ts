import { GoogleOAuthServicePort } from '@/modules/authentication/application/ports/google-oauth.out-port';
import {
  GetGoogleAuthUrlCommand,
  GetGoogleAuthUrlPort
} from '@/modules/authentication/application/use-cases/get-google-auth-url/get-google-auth-url.port';

export class GetGoogleAuthUrlUseCase extends GetGoogleAuthUrlPort {
  constructor(private readonly googleOAuthService: GoogleOAuthServicePort) {
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
