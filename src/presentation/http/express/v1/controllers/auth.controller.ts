import type { Disable2FAPort } from '@/modules/authentication/application/use-cases/disable-2fa/disable-2fa.port';
import type { ForgotPasswordPort } from '@/modules/authentication/application/use-cases/forgot-password/forgot-password.port';
import type { LoginEmailPort } from '@/modules/authentication/application/use-cases/login-email/login-email.port';
import type { LogoutPort } from '@/modules/authentication/application/use-cases/logout/logout.port';
import type { RefreshTokenPort } from '@/modules/authentication/application/use-cases/refresh-token/refresh-token.port';
import type { RegisterPort } from '@/modules/authentication/application/use-cases/register/register.port';
import type { SendOtpPort } from '@/modules/authentication/application/use-cases/send-otp/send-otp.port';
import type { Setup2FAPort } from '@/modules/authentication/application/use-cases/setup-2fa/setup-2fa.port';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  refreshTokenCookieSharedOptions,
  refreshTokenMaxAgeMs
} from '@/presentation/http/express/constants/auth.constants';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created, type SuccessResponse } from '@/presentation/http/express/responses/success.response';
import type { ExpressRequest, ExpressResponse, ValidatedRequest } from '@/presentation/http/express/types';
import type {
  Disable2faBodySchema,
  ForgotPasswordBodySchema,
  LoginBodySchema,
  RegisterBodySchema,
  SendOtpBodySchema
} from '@/presentation/http/express/v1/schemas/auth/auth.request.schema';
import type {
  AccessTokenResponse,
  Enable2faResponse
} from '@/presentation/http/express/v1/schemas/auth/auth.response.schema';
import type { UserResponse } from '@/presentation/http/express/v1/schemas/user/user.response.schema';

type RegisterRequest = ValidatedRequest<{ body: typeof RegisterBodySchema }>;
type LoginRequest = ValidatedRequest<{ body: typeof LoginBodySchema }>;
type ForgotPasswordRequest = ValidatedRequest<{ body: typeof ForgotPasswordBodySchema }>;
type SendOtpRequest = ValidatedRequest<{ body: typeof SendOtpBodySchema }>;
type Disable2faRequest = ValidatedRequest<{ body: typeof Disable2faBodySchema }>;

export interface IAuthController {
  register(req: RegisterRequest): Promise<SuccessResponse<UserResponse>>;
  login(req: LoginRequest, res: ExpressResponse): Promise<SuccessResponse<AccessTokenResponse>>;
  logout(req: ExpressRequest, res: ExpressResponse): Promise<SuccessResponse<unknown>>;
  refreshToken(req: ExpressRequest, res: ExpressResponse): Promise<SuccessResponse<AccessTokenResponse>>;
  forgotPassword(req: ForgotPasswordRequest): Promise<SuccessResponse<unknown>>;
  sendOtp(req: SendOtpRequest): Promise<SuccessResponse<unknown>>;
  enable2fa(req: ExpressRequest): Promise<SuccessResponse<Enable2faResponse>>;
  disable2fa(req: Disable2faRequest): Promise<SuccessResponse<unknown>>;
}

export class AuthController extends BaseController implements IAuthController {
  constructor(
    private readonly registerUC: RegisterPort,
    private readonly loginEmailUC: LoginEmailPort,
    private readonly logoutUC: LogoutPort,
    private readonly refreshTokenUC: RefreshTokenPort,
    private readonly forgotPasswordUC: ForgotPasswordPort,
    private readonly sendOtpUC: SendOtpPort,
    private readonly setup2faUC: Setup2FAPort,
    private readonly disable2faUC: Disable2FAPort
  ) {
    super();
  }

  @AutoBind()
  async register(req: RegisterRequest) {
    const body = req.body;

    const user = await this.registerUC.execute({
      name: body.name,
      email: body.email,
      password: body.password,
      birthday: body.birthday,
      code: body.code
    });

    return this.response<UserResponse>({
      instance: Created,
      data: user,
      message: 'User registered successfully'
    });
  }

  @AutoBind()
  async login(req: LoginRequest, res: ExpressResponse) {
    const body = req.body;

    const { accessToken, refreshToken } = await this.loginEmailUC.execute({
      email: body.email,
      password: body.password,
      totpCode: body.totpCode,
      emailOtpCode: body.emailOtpCode
    });

    this.setCookie(res, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      ...refreshTokenCookieSharedOptions,
      maxAge: refreshTokenMaxAgeMs(refreshToken)
    });

    return this.response<AccessTokenResponse>({
      data: { accessToken },
      message: 'Login successfully'
    });
  }

  @AutoBind()
  async logout(req: ExpressRequest, res: ExpressResponse) {
    await this.logoutUC.execute({
      refreshToken: req.cookies[REFRESH_TOKEN_COOKIE_NAME]
    });

    this.clearCookie(res, REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieSharedOptions);

    return this.response({
      message: 'Logout successfully'
    });
  }

  @AutoBind()
  async refreshToken(req: ExpressRequest, res: ExpressResponse) {
    const { accessToken, refreshToken } = await this.refreshTokenUC.execute({
      refreshToken: req.cookies[REFRESH_TOKEN_COOKIE_NAME]
    });

    this.setCookie(res, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      ...refreshTokenCookieSharedOptions,
      maxAge: refreshTokenMaxAgeMs(refreshToken)
    });

    return this.response<AccessTokenResponse>({
      data: { accessToken },
      message: 'Refresh token successfully'
    });
  }

  @AutoBind()
  async forgotPassword(req: ForgotPasswordRequest) {
    const body = req.body;

    await this.forgotPasswordUC.execute({
      email: body.email,
      code: body.code,
      password: body.password
    });

    return this.response({
      message: 'Forgot password successfully'
    });
  }

  @AutoBind()
  async sendOtp(req: SendOtpRequest) {
    const body = req.body;

    await this.sendOtpUC.execute({
      email: body.email,
      type: body.type
    });

    return this.response({
      message: 'Otp sent successfully'
    });
  }

  @AutoBind()
  async enable2fa(req: ExpressRequest) {
    const userId = this.getUserId(req);

    const data = await this.setup2faUC.execute({ userId });

    return this.response<Enable2faResponse>({
      data,
      message: 'Enable 2fa successfully'
    });
  }

  @AutoBind()
  async disable2fa(req: Disable2faRequest) {
    const userId = this.getUserId(req);

    const body = req.body;

    await this.disable2faUC.execute({
      userId,
      totpCode: body.totpCode,
      emailOtpCode: body.emailOtpCode
    });

    return this.response({
      message: 'Disable 2fa successfully'
    });
  }
}
