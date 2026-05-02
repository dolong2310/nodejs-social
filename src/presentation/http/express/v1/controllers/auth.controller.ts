import { Disable2FAInPort } from '@/modules/auth/application/use-cases/disable-2fa/disable-2fa.in-port';
import { ForgotPasswordInPort } from '@/modules/auth/application/use-cases/forgot-password/forgot-password.in-port';
import { LoginEmailInPort } from '@/modules/auth/application/use-cases/login-email/login-email.in-port';
import { LogoutInPort } from '@/modules/auth/application/use-cases/logout/logout.in-port';
import { RefreshTokenInPort } from '@/modules/auth/application/use-cases/refresh-token/refresh-token.in-port';
import { RegisterInPort } from '@/modules/auth/application/use-cases/register/register.in-port';
import { SendOtpInPort } from '@/modules/auth/application/use-cases/send-otp/send-otp.in-port';
import { Setup2FAInPort } from '@/modules/auth/application/use-cases/setup-2fa/setup-2fa.in-port';
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
  register(req: Request<ParamsDictionary, object, RegisterRequestDTO>, res: Response): Promise<void>;
  login(req: Request<ParamsDictionary, object, LoginRequestDTO>, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  refreshToken(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request<ParamsDictionary, object, ForgotPasswordRequestDTO>, res: Response): Promise<void>;
  sendOtp(req: Request<ParamsDictionary, object, SendOtpRequestDTO>, res: Response): Promise<void>;
  enable2fa(req: Request, res: Response): Promise<void>;
  disable2fa(req: Request<ParamsDictionary, object, Disable2faRequestDTO>, res: Response): Promise<void>;
}

export class AuthController extends BaseController implements IAuthController {
  constructor(
    private readonly registerUC: RegisterInPort,
    private readonly loginEmailUC: LoginEmailInPort,
    private readonly logoutUC: LogoutInPort,
    private readonly refreshTokenUC: RefreshTokenInPort,
    private readonly forgotPasswordUC: ForgotPasswordInPort,
    private readonly sendOtpUC: SendOtpInPort,
    private readonly setup2faUC: Setup2FAInPort,
    private readonly disable2faUC: Disable2FAInPort
  ) {
    super();
  }

  @AutoBind()
  async register(req: Request<ParamsDictionary, object, RegisterRequestDTO>, res: Response) {
    const dto = new RegisterRequestDTO(req.body);

    const user = await this.registerUC.execute(dto);

    this.sendResponse<RegisterResponseDTO>({
      res,
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

    this.sendResponse<LoginResponseDTO>({
      res,
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

    this.sendResponse<LogoutResponseDTO>({
      res,
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

    this.sendResponse<RefreshTokenResponseDTO>({
      res,
      data: { accessToken },
      message: 'Refresh token successfully'
    });
  }

  @AutoBind()
  async forgotPassword(req: Request<ParamsDictionary, object, ForgotPasswordRequestDTO>, res: Response) {
    const dto = new ForgotPasswordRequestDTO(req.body);

    await this.forgotPasswordUC.execute(dto);

    this.sendResponse<ForgotPasswordResponseDTO>({
      res,
      message: 'Forgot password successfully'
    });
  }

  @AutoBind()
  async sendOtp(req: Request<ParamsDictionary, object, SendOtpRequestDTO>, res: Response) {
    const dto = new SendOtpRequestDTO(req.body);

    await this.sendOtpUC.execute(dto);

    this.sendResponse<SendOtpResponseDTO>({
      res,
      message: 'Otp sent successfully'
    });
  }

  @AutoBind()
  async enable2fa(req: Request, res: Response) {
    const userId = this.getUserId(req);

    const data = await this.setup2faUC.execute({ userId });

    this.sendResponse<Enable2faResponseDTO>({
      res,
      data: new Enable2faResponseDTO(data),
      message: 'Enable 2fa successfully'
    });
  }

  @AutoBind()
  async disable2fa(req: Request<ParamsDictionary, object, Disable2faRequestDTO>, res: Response) {
    const userId = this.getUserId(req);
    const dto = new Disable2faRequestDTO(req.body);

    await this.disable2faUC.execute({ userId, totpCode: dto.totpCode, emailOtpCode: dto.emailOtpCode });

    this.sendResponse<Disable2faResponseDTO>({
      res,
      message: 'Disable 2fa successfully'
    });
  }
}
