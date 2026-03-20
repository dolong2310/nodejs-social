export class RegisterRequestDTO {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string;

  constructor(body: { name: string; email: string; password: string; dateOfBirth: string }) {
    this.name = body.name.trim();
    this.email = body.email.toLowerCase().trim();
    this.password = body.password;
    this.dateOfBirth = body.dateOfBirth;
  }
}

export class LoginRequestDTO {
  email: string;
  password: string;

  constructor(body: { email: string; password: string }) {
    this.email = body.email.toLowerCase().trim();
    this.password = body.password;
  }
}

export class LogoutRequestDTO {
  refreshToken: string;

  constructor(body: { refreshToken: string }) {
    this.refreshToken = body.refreshToken;
  }
}

export class RefreshTokenRequestDTO {
  refreshToken: string;

  constructor(body: { refreshToken: string }) {
    this.refreshToken = body.refreshToken;
  }
}

export class VerifyEmailRequestDTO {
  token: string;

  constructor(body: { token: string }) {
    this.token = body.token;
  }
}

export class ForgotPasswordRequestDTO {
  email: string;

  constructor(body: { email: string }) {
    this.email = body.email.toLowerCase().trim();
  }
}

export class ResetPasswordRequestDTO {
  token: string;
  password: string;
  confirmPassword: string;

  constructor(body: { token: string; password: string; confirmPassword: string }) {
    this.token = body.token;
    this.password = body.password;
    this.confirmPassword = body.confirmPassword;
  }
}

export class ChangePasswordRequestDTO {
  password: string;
  confirmPassword: string;

  constructor(body: { password: string; confirmPassword: string }) {
    this.password = body.password;
    this.confirmPassword = body.confirmPassword;
  }
}
