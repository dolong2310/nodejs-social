import {
  ChangePasswordPayloadDTO,
  CreateAuthSessionPayloadDTO,
  ForgotPasswordPayloadDTO,
  LoginPayloadDTO,
  LogoutPayloadDTO,
  RefreshTokenPayloadDTO,
  RegisterPayloadDTO,
  ResendVerifyEmailPayloadDTO,
  ResetPasswordPayloadDTO,
  VerifyEmailPayloadDTO
} from '@/application/dtos/auth/auth.payload.dto';
import {
  AuthTokenPairResultDTO,
  ChangePasswordResultDTO,
  ForgotPasswordResultDTO,
  LogoutResultDTO,
  RegisterResultDTO,
  ResendVerifyEmailResultDTO,
  ResetPasswordResultDTO,
  VerifyEmailResultDTO
} from '@/application/dtos/auth/auth.result.dto';

export interface IAuthService {
  register(payload: RegisterPayloadDTO, options: { autoLogin: true }): Promise<AuthTokenPairResultDTO>;
  register(payload: RegisterPayloadDTO, options?: { autoLogin?: false }): Promise<RegisterResultDTO>;
  register(
    payload: RegisterPayloadDTO,
    options?: { autoLogin?: boolean }
  ): Promise<RegisterResultDTO | AuthTokenPairResultDTO>;
  login(payload: LoginPayloadDTO): Promise<AuthTokenPairResultDTO>;
  logout(payload: LogoutPayloadDTO): Promise<LogoutResultDTO>;
  refreshToken(payload: RefreshTokenPayloadDTO): Promise<AuthTokenPairResultDTO>;
  verifyEmail(payload: VerifyEmailPayloadDTO): Promise<VerifyEmailResultDTO>;
  resendVerifyEmail(payload: ResendVerifyEmailPayloadDTO): Promise<ResendVerifyEmailResultDTO>;
  forgotPassword(payload: ForgotPasswordPayloadDTO): Promise<ForgotPasswordResultDTO>;
  resetPassword(payload: ResetPasswordPayloadDTO): Promise<ResetPasswordResultDTO>;
  changePassword(payload: ChangePasswordPayloadDTO): Promise<ChangePasswordResultDTO>;
  createAuthSession(payload: CreateAuthSessionPayloadDTO): Promise<AuthTokenPairResultDTO>;
}
