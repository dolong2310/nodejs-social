import { GoogleOAuthServicePort, IGoogleUserInfo } from '@/modules/authentication/application/ports/google-oauth.port';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export class GoogleOAuthService implements GoogleOAuthServicePort {
  private readonly client: OAuth2Client;

  constructor(readonly config: GoogleOAuthConfig) {
    this.client = new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
  }

  generateAuthUrl(payload: { state: string; scope: string[] }): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      include_granted_scopes: true,
      prompt: 'select_account',
      scope: payload.scope,
      state: payload.state
    });
  }

  async getUserInfoFromCode(code: string): Promise<IGoogleUserInfo> {
    const { tokens } = await this.client.getToken(code);

    this.client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: this.client,
      version: 'v2'
    });

    const { data } = await oauth2.userinfo.get();

    return {
      email: data.email ?? '',
      name: data.name ?? '',
      verifiedEmail: Boolean(data.verified_email)
    };
  }
}
