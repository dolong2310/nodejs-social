import { MessageResultDTO } from '@/application/dtos/common/common.result.dto';
import { UserResultDTO } from '@/application/dtos/user/user.result.dto';

export class RegisterResultDTO extends UserResultDTO {}

export class LoginResultDTO {
  accessToken: string;
  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}

export class LogoutResultDTO extends MessageResultDTO {}

export class RefreshTokenResultDTO extends LoginResultDTO {}

export class VerifyEmailResultDTO extends MessageResultDTO {}

export class ResendVerifyEmailResultDTO extends MessageResultDTO {}

export class ForgotPasswordResultDTO extends MessageResultDTO {}

export class ResetPasswordResultDTO extends MessageResultDTO {}

export class ChangePasswordResultDTO extends MessageResultDTO {}

export class AuthTokenPairResultDTO {
  accessToken: string;
  refreshToken: string;
  constructor(payload: { accessToken: string; refreshToken: string }) {
    this.accessToken = payload.accessToken;
    this.refreshToken = payload.refreshToken;
  }
}
