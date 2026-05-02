export interface ITwoFactorAuthPort {
  generateSecret(email: string): { secret: string; uri: string };
  verifyTOTP(data: { email: string; secret?: string; token: string }): boolean;
}
