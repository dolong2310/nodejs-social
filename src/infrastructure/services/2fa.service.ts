import { ITwoFactorAuthPort } from '@/modules/core/application/ports/2fa.port';
import { Secret, TOTP } from 'otpauth';

export class TwoFactorAuthService implements ITwoFactorAuthPort {
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
    // window: 1 là số lượng khoảng thời gian (time step) mà token có thể hợp lệ
    // Giả sử period là 30s thì window: 1 là 30s, trong khoảng thời gian sau khi token mới được tạo ra thì token cũ vẫn còn hợp lệ
    const delta = totp.validate({ token: data.token, window: 1 });
    return delta !== null; // nếu token không hợp lệ thì delta sẽ là null và ngược lại thì delta sẽ là number
  }
}
