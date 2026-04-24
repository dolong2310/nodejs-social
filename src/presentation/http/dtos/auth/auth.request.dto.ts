export class RegisterRequestDTO {
  name: string;
  email: string;
  password: string;
  birthday: string;
  code: string;

  constructor(body: { name: string; email: string; password: string; birthday: string; code: string }) {
    this.name = body.name.trim();
    this.email = body.email.toLowerCase().trim();
    this.password = body.password;
    this.birthday = body.birthday;
    this.code = body.code;
  }
}

export class LoginRequestDTO {
  email: string;
  password: string;
  totpCode?: string;
  emailOtpCode?: string;

  constructor(body: { email: string; password: string; totpCode?: string; emailOtpCode?: string }) {
    this.email = body.email.toLowerCase().trim();
    this.password = body.password;
    this.totpCode = body.totpCode;
    this.emailOtpCode = body.emailOtpCode;
  }
}

export class LogoutRequestDTO {
  refreshToken: string;

  constructor(refreshToken: string) {
    this.refreshToken = refreshToken;
  }
}

export class RefreshTokenRequestDTO {
  refreshToken: string;

  constructor(refreshToken: string) {
    this.refreshToken = refreshToken;
  }
}

export class ForgotPasswordRequestDTO {
  email: string;
  code: string;
  password: string;

  constructor(body: { email: string; code: string; password: string }) {
    this.email = body.email.toLowerCase().trim();
    this.code = body.code;
    this.password = body.password;
  }
}
