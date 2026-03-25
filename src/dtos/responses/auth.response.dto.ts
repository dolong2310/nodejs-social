import { UserResponseDTO } from '@/dtos/responses/user.response.dto';

export class RegisterResponseDTO extends UserResponseDTO {}

/** Internal token pair (AuthService / OAuth); refresh only sent via httpOnly cookie at HTTP layer. */
export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseDTO {
  accessToken: string;
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
