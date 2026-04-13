import { GetGoogleAuthUrlPayloadDTO, OAuthGoogleLoginPayloadDTO } from '@/application/dtos/oauth/oauth.payload.dto';
import { OAuthGoogleLoginResultDTO } from '@/application/dtos/oauth/oauth.result.dto';

export interface IOAuthService {
  getGoogleAuthUrl(payload: GetGoogleAuthUrlPayloadDTO): string;
  googleLogin(payload: OAuthGoogleLoginPayloadDTO): Promise<OAuthGoogleLoginResultDTO>;
}
