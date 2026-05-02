import { IGoogleOAuthService, IGoogleUserInfo } from '@/modules/auth/application/ports/google-oauth.out-port';
import { envConfig } from '@/bootstrap/config/env.config';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

export class GoogleOAuthService implements IGoogleOAuthService {
  private readonly client: OAuth2Client;

  constructor() {
    this.client = new google.auth.OAuth2(
      envConfig.GOOGLE_CLIENT_ID,
      envConfig.GOOGLE_CLIENT_SECRET,
      envConfig.GOOGLE_REDIRECT_URI
    );
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
