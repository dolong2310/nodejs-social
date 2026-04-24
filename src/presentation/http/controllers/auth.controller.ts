import { ForgotPasswordInPort } from '@/application/use-cases/auth/forgot-password/forgot-password.in-port';
import { LoginEmailInPort } from '@/application/use-cases/auth/login-email/login-email.in-port';
import { LogoutInPort } from '@/application/use-cases/auth/logout/logout.in-port';
import { RefreshTokenInPort } from '@/application/use-cases/auth/refresh-token/refresh-token.in-port';
import { RegisterInPort } from '@/application/use-cases/auth/register/register.in-port';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  refreshTokenCookieSharedOptions,
  refreshTokenMaxAgeMs
} from '@/presentation/http/constants/auth.constant';
import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import {
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
  RegisterRequestDTO
} from '@/presentation/http/dtos/auth/auth.request.dto';
import {
  ForgotPasswordResponseDTO,
  LoginResponseDTO,
  LogoutResponseDTO,
  RefreshTokenResponseDTO,
  RegisterResponseDTO
} from '@/presentation/http/dtos/auth/auth.response.dto';
import { Created } from '@/presentation/http/responses/success.response';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IAuthController {
  register(req: Request<ParamsDictionary, object, RegisterRequestDTO>, res: Response): Promise<void>;
  login(req: Request<ParamsDictionary, object, LoginRequestDTO>, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  refreshToken(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request<ParamsDictionary, object, ForgotPasswordRequestDTO>, res: Response): Promise<void>;
}

export class AuthController extends BaseController implements IAuthController {
  constructor(
    private readonly registerUC: RegisterInPort,
    private readonly loginEmailUC: LoginEmailInPort,
    private readonly logoutUC: LogoutInPort,
    private readonly refreshTokenUC: RefreshTokenInPort,
    private readonly forgotPasswordUC: ForgotPasswordInPort
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
    const dto = new LogoutRequestDTO(req[REFRESH_TOKEN_COOKIE_NAME]!);

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
    const dto = new RefreshTokenRequestDTO(req[REFRESH_TOKEN_COOKIE_NAME]!);

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
}
