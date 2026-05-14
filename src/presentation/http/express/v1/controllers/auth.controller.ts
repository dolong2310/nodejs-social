import { Disable2FAPort } from '@/modules/authentication/application/use-cases/disable-2fa/disable-2fa.port';
import { ForgotPasswordPort } from '@/modules/authentication/application/use-cases/forgot-password/forgot-password.port';
import { LoginEmailPort } from '@/modules/authentication/application/use-cases/login-email/login-email.port';
import { LogoutPort } from '@/modules/authentication/application/use-cases/logout/logout.port';
import { RefreshTokenPort } from '@/modules/authentication/application/use-cases/refresh-token/refresh-token.port';
import { RegisterPort } from '@/modules/authentication/application/use-cases/register/register.port';
import { SendOtpPort } from '@/modules/authentication/application/use-cases/send-otp/send-otp.port';
import { Setup2FAPort } from '@/modules/authentication/application/use-cases/setup-2fa/setup-2fa.port';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  refreshTokenCookieSharedOptions,
  refreshTokenMaxAgeMs
} from '@/presentation/http/express/constants/auth.constant';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created, SuccessResponse } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import {
  Disable2faRequestDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
  RegisterRequestDTO,
  SendOtpRequestDTO
} from '@/presentation/http/express/v1/dtos/auth/auth.request.dto';
import {
  Disable2faResponseDTO,
  Enable2faResponseDTO,
  ForgotPasswordResponseDTO,
  LoginResponseDTO,
  LogoutResponseDTO,
  RefreshTokenResponseDTO,
  RegisterResponseDTO,
  SendOtpResponseDTO
} from '@/presentation/http/express/v1/dtos/auth/auth.response.dto';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IAuthController {
  register(
    req: ExpressRequest<ParamsDictionary, object, RegisterRequestDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<RegisterResponseDTO>>;
  login(
    req: ExpressRequest<ParamsDictionary, object, LoginRequestDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<LoginResponseDTO>>;
  logout(req: ExpressRequest, res: ExpressResponse, next: NextFunction): Promise<SuccessResponse<LogoutResponseDTO>>;
  refreshToken(
    req: ExpressRequest,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<RefreshTokenResponseDTO>>;
  forgotPassword(
    req: ExpressRequest<ParamsDictionary, object, ForgotPasswordRequestDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<ForgotPasswordResponseDTO>>;
  sendOtp(
    req: ExpressRequest<ParamsDictionary, object, SendOtpRequestDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<SendOtpResponseDTO>>;
  enable2fa(
    req: ExpressRequest,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<Enable2faResponseDTO>>;
  disable2fa(
    req: ExpressRequest<ParamsDictionary, object, Disable2faRequestDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<Disable2faResponseDTO>>;
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
  async register(req: ExpressRequest<ParamsDictionary, object, RegisterRequestDTO>) {
    const dto = new RegisterRequestDTO(req.body);

    const user = await this.registerUC.execute(dto);

    return this.response<RegisterResponseDTO>({
      instance: Created,
      data: user,
      message: 'User registered successfully'
    });
  }

  @AutoBind()
  async login(req: ExpressRequest<ParamsDictionary, object, LoginRequestDTO>, res: ExpressResponse) {
    const dto = new LoginRequestDTO(req.body);

    const { accessToken, refreshToken } = await this.loginEmailUC.execute(dto);

    this.setCookie(res, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      ...refreshTokenCookieSharedOptions,
      maxAge: refreshTokenMaxAgeMs(refreshToken)
    });

    return this.response<LoginResponseDTO>({
      data: { accessToken },
      message: 'Login successfully'
    });
  }

  @AutoBind()
  async logout(req: ExpressRequest, res: ExpressResponse) {
    const dto = new LogoutRequestDTO(req.cookies[REFRESH_TOKEN_COOKIE_NAME]);

    await this.logoutUC.execute({
      refreshToken: dto.refreshToken
    });

    this.clearCookie(res, REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieSharedOptions);

    return this.response<LogoutResponseDTO>({
      message: 'Logout successfully'
    });
  }

  @AutoBind()
  async refreshToken(req: ExpressRequest, res: ExpressResponse) {
    const dto = new RefreshTokenRequestDTO(req.cookies[REFRESH_TOKEN_COOKIE_NAME]);

    const { accessToken, refreshToken } = await this.refreshTokenUC.execute({
      refreshToken: dto.refreshToken
    });

    this.setCookie(res, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      ...refreshTokenCookieSharedOptions,
      maxAge: refreshTokenMaxAgeMs(refreshToken)
    });

    return this.response<RefreshTokenResponseDTO>({
      data: { accessToken },
      message: 'Refresh token successfully'
    });
  }

  @AutoBind()
  async forgotPassword(req: ExpressRequest<ParamsDictionary, object, ForgotPasswordRequestDTO>) {
    const dto = new ForgotPasswordRequestDTO(req.body);

    await this.forgotPasswordUC.execute(dto);

    return this.response<ForgotPasswordResponseDTO>({
      message: 'Forgot password successfully'
    });
  }

  @AutoBind()
  async sendOtp(req: ExpressRequest<ParamsDictionary, object, SendOtpRequestDTO>) {
    const dto = new SendOtpRequestDTO(req.body);

    await this.sendOtpUC.execute(dto);

    return this.response<SendOtpResponseDTO>({
      message: 'Otp sent successfully'
    });
  }

  @AutoBind()
  async enable2fa(req: ExpressRequest) {
    const userId = this.getUserId(req);

    const data = await this.setup2faUC.execute({ userId });

    return this.response<Enable2faResponseDTO>({
      data: new Enable2faResponseDTO(data),
      message: 'Enable 2fa successfully'
    });
  }

  @AutoBind()
  async disable2fa(req: ExpressRequest<ParamsDictionary, object, Disable2faRequestDTO>) {
    const userId = this.getUserId(req);
    const dto = new Disable2faRequestDTO(req.body);

    await this.disable2faUC.execute({ userId, totpCode: dto.totpCode, emailOtpCode: dto.emailOtpCode });

    return this.response<Disable2faResponseDTO>({
      message: 'Disable 2fa successfully'
    });
  }
}
