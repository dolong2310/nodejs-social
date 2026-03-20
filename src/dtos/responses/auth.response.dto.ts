import { UserResponseDTO } from '@/dtos/responses/user.response.dto';

export class RegisterResponseDTO extends UserResponseDTO {}

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutResponseDTO {
  message: string;
}

export interface RefreshTokenResponseDTO extends LoginResponseDTO {}

export interface VerifyEmailResponseDTO {
  message: string;
}

export interface ResendVerifyEmailResponseDTO {
  message: string;
}

export interface ForgotPasswordResponseDTO {
  message: string;
}

export interface ResetPasswordResponseDTO {
  message: string;
}

export interface ChangePasswordResponseDTO {
  message: string;
}
