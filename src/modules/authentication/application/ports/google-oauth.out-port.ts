export interface IGoogleUserInfo {
  email: string;
  name: string;
  verifiedEmail: boolean;
}

export interface GoogleOAuthServicePort {
  generateAuthUrl(payload: { state: string; scope: string[] }): string;
  getUserInfoFromCode(code: string): Promise<IGoogleUserInfo>;
}
