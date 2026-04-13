import { ETokenType } from '@/domain/enums/token.enum';

import { UserIdPayloadDTO } from '@/application/dtos/common/common.payload.dto';

export class RegisterPayloadDTO {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string;
  constructor(payload: { name: string; email: string; password: string; dateOfBirth: string }) {
    this.name = payload.name.trim();
    this.email = payload.email.toLowerCase().trim();
    this.password = payload.password;
    this.dateOfBirth = payload.dateOfBirth;
  }
}

export class LoginPayloadDTO {
  email: string;
  password: string;
  constructor(payload: { email: string; password: string }) {
    this.email = payload.email.toLowerCase().trim();
    this.password = payload.password;
  }
}

export class LogoutPayloadDTO {
  refreshToken: string;
  type: ETokenType;
  constructor(payload: { refreshToken: string; type: ETokenType }) {
    this.refreshToken = payload.refreshToken;
    this.type = payload.type;
  }
}

export class RefreshTokenPayloadDTO {
  refreshToken: string;
  userId: string;
  exp: number;
  type: ETokenType;
  constructor(payload: { refreshToken: string; userId: string; exp: number; type: ETokenType }) {
    this.refreshToken = payload.refreshToken;
    this.userId = payload.userId;
    this.exp = payload.exp;
    this.type = payload.type;
  }
}

export class VerifyEmailPayloadDTO {
  token: string;
  userId: string;
  constructor(payload: { token: string; userId: string }) {
    this.token = payload.token;
    this.userId = payload.userId;
  }
}

export class ResendVerifyEmailPayloadDTO extends UserIdPayloadDTO {}

export class ForgotPasswordPayloadDTO {
  email: string;
  constructor(payload: { email: string }) {
    this.email = payload.email.toLowerCase().trim();
  }
}

export class ResetPasswordPayloadDTO {
  token: string;
  userId: string;
  password: string;
  confirmPassword: string;
  constructor(payload: { token: string; userId: string; password: string; confirmPassword: string }) {
    this.token = payload.token;
    this.userId = payload.userId;
    this.password = payload.password;
    this.confirmPassword = payload.confirmPassword;
  }
}

export class ChangePasswordPayloadDTO {
  userId: string;
  password: string;
  confirmPassword: string;
  constructor(payload: { userId: string; password: string; confirmPassword: string }) {
    this.userId = payload.userId;
    this.password = payload.password;
    this.confirmPassword = payload.confirmPassword;
  }
}

export class CreateAuthSessionPayloadDTO {
  userId: string;
  constructor(payload: { userId: string }) {
    this.userId = payload.userId;
  }
}
