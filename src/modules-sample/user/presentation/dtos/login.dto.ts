import type { LoginEmailPasswordCommand } from '@/modules/user/application/use-cases/ports/login-email-password.in-port';

export interface LoginEmailPasswordDTO extends LoginEmailPasswordCommand {}

export interface LoginEmailPasswordDtoResponse {
  accessToken: string;
  refreshToken: string;
}
