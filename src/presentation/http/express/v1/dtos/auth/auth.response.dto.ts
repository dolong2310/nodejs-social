import { UserResponseDTO } from '@/presentation/http/express/v1/dtos/user/user.response.dto';

export class RegisterResponseDTO extends UserResponseDTO {}

export class LoginResponseDTO {
  accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}

export class LogoutResponseDTO {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class RefreshTokenResponseDTO extends LoginResponseDTO {}

export class VerifyEmailResponseDTO {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class ResendVerifyEmailResponseDTO {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class ForgotPasswordResponseDTO {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class ResetPasswordResponseDTO {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class SendOtpResponseDTO {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class Enable2faResponseDTO {
  secret: string;
  uri: string;

  constructor(body: { secret: string; uri: string }) {
    this.secret = body.secret;
    this.uri = body.uri;
  }
}

export class Disable2faResponseDTO {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}
