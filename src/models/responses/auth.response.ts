import { EUserVerificationStatus } from '@/enums/users.enum';

export interface IRegisterResponse {
  _id: string;
  name: string;
  email: string;
  dateOfBirth: Date;
  verificationStatus?: EUserVerificationStatus;

  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ILogoutResponse {
  message: string;
}

export interface IRefreshTokenResponse extends ILoginResponse {}

export interface IVerifyEmailResponse {
  message: string;
}

export interface IResendVerifyEmailResponse {
  message: string;
}

export interface IForgotPasswordResponse {
  message: string;
}

export interface IResetPasswordResponse {
  message: string;
}

export interface IChangePasswordResponse {
  message: string;
}
