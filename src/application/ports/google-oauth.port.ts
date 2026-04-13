export interface IGoogleUserInfo {
  email: string;
  name: string;
  verifiedEmail: boolean;
}

export interface IGoogleOAuthService {
  generateAuthUrl(payload: { state: string; scope: string[] }): string;
  getUserInfoFromCode(code: string): Promise<IGoogleUserInfo>;
}
