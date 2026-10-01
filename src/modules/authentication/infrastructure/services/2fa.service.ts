import type { TwoFactorAuthPort } from '@/modules/authentication/application/ports/2fa.port';
import { Secret, TOTP } from 'otpauth';

export class TwoFactorAuthService implements TwoFactorAuthPort {
  private createTOTP(email: string, secret?: string): TOTP {
    return new TOTP({
      issuer: 'Social App', // TODO: use envConfig.APP_NAME,
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret || new Secret()
    });
  }

  generateSecret(email: string): { secret: string; uri: string } {
    const totp = this.createTOTP(email);
    return {
      secret: totp.secret.base32,
      uri: totp.toString()
    };
  }

  verifyTOTP(data: { email: string; secret?: string; token: string }): boolean {
    const totp = this.createTOTP(data.email, data?.secret);
    // window: 1 is the number of time steps in which the token may be valid.
    // With a 30s period, window: 1 gives a 30s grace period where the previous token can still be valid.
    const delta = totp.validate({ token: data.token, window: 1 });
    return delta !== null; // invalid tokens return null; valid tokens return a number.
  }
}
