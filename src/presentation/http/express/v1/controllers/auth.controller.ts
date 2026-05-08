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
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
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
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IAuthController {
  register(req: Request<ParamsDictionary, object, RegisterRequestDTO>): Promise<unknown>;
  login(req: Request<ParamsDictionary, object, LoginRequestDTO>, res: Response): Promise<unknown>;
  logout(req: Request, res: Response): Promise<unknown>;
  refreshToken(req: Request, res: Response): Promise<unknown>;
  forgotPassword(req: Request<ParamsDictionary, object, ForgotPasswordRequestDTO>): Promise<unknown>;
  sendOtp(req: Request<ParamsDictionary, object, SendOtpRequestDTO>): Promise<unknown>;
  enable2fa(req: Request): Promise<unknown>;
  disable2fa(req: Request<ParamsDictionary, object, Disable2faRequestDTO>): Promise<unknown>;
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
  async register(req: Request<ParamsDictionary, object, RegisterRequestDTO>) {
    const dto = new RegisterRequestDTO(req.body);

    const user = await this.registerUC.execute(dto);

    return this.response<RegisterResponseDTO>({
      instance: Created,
      data: user,
      message: 'User registered successfully'
    });
  }

  @AutoBind()
  async login(req: Request<ParamsDictionary, object, LoginRequestDTO>, res: Response) {
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
  async logout(req: Request, res: Response) {
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
  async refreshToken(req: Request, res: Response) {
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
  async forgotPassword(req: Request<ParamsDictionary, object, ForgotPasswordRequestDTO>) {
    const dto = new ForgotPasswordRequestDTO(req.body);

    await this.forgotPasswordUC.execute(dto);

    return this.response<ForgotPasswordResponseDTO>({
      message: 'Forgot password successfully'
    });
  }

  @AutoBind()
  async sendOtp(req: Request<ParamsDictionary, object, SendOtpRequestDTO>) {
    const dto = new SendOtpRequestDTO(req.body);

    await this.sendOtpUC.execute(dto);

    return this.response<SendOtpResponseDTO>({
      message: 'Otp sent successfully'
    });
  }

  @AutoBind()
  async enable2fa(req: Request) {
    const userId = this.getUserId(req);

    const data = await this.setup2faUC.execute({ userId });

    return this.response<Enable2faResponseDTO>({
      data: new Enable2faResponseDTO(data),
      message: 'Enable 2fa successfully'
    });
  }

  @AutoBind()
  async disable2fa(req: Request<ParamsDictionary, object, Disable2faRequestDTO>) {
    const userId = this.getUserId(req);
    const dto = new Disable2faRequestDTO(req.body);

    await this.disable2faUC.execute({ userId, totpCode: dto.totpCode, emailOtpCode: dto.emailOtpCode });

    return this.response<Disable2faResponseDTO>({
      message: 'Disable 2fa successfully'
    });
  }
}
