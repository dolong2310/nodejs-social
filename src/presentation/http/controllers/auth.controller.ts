import { IAuthService } from '@/application/ports/auth.port';

import {
  REFRESH_TOKEN_COOKIE_NAME,
  refreshTokenCookieSharedOptions,
  refreshTokenMaxAgeMs
} from '@/presentation/http/constants/auth.constant';
import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import {
  ChangePasswordRequestDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
  VerifyEmailRequestDTO
} from '@/presentation/http/dtos/auth/auth.request.dto';
import {
  ChangePasswordResponseDTO,
  ForgotPasswordResponseDTO,
  LoginResponseDTO,
  LogoutResponseDTO,
  RefreshTokenResponseDTO,
  RegisterResponseDTO,
  ResendVerifyEmailResponseDTO,
  ResetPasswordResponseDTO,
  VerifyEmailResponseDTO
} from '@/presentation/http/dtos/auth/auth.response.dto';
import { Created } from '@/presentation/http/responses/success.response';

import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IAuthController {
  register(req: Request<ParamsDictionary, object, RegisterRequestDTO>, res: Response): Promise<void>;
  login(req: Request<ParamsDictionary, object, LoginRequestDTO>, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  refreshToken(req: Request, res: Response): Promise<void>;
  verifyEmail(req: Request<ParamsDictionary, object, VerifyEmailRequestDTO>, res: Response): Promise<void>;
  resendVerifyEmail(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request<ParamsDictionary, object, ForgotPasswordRequestDTO>, res: Response): Promise<void>;
  resetPassword(req: Request<ParamsDictionary, object, ResetPasswordRequestDTO>, res: Response): Promise<void>;
  changePassword(req: Request<ParamsDictionary, object, ChangePasswordRequestDTO>, res: Response): Promise<void>;
}

export class AuthController extends BaseController implements IAuthController {
  constructor(private readonly authService: IAuthService) {
    super();
  }

  @AutoBind()
  async register(req: Request<ParamsDictionary, object, RegisterRequestDTO>, res: Response) {
    const dto = new RegisterRequestDTO(req.body);

    const user = await this.authService.register(dto);

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

    const { accessToken, refreshToken } = await this.authService.login(dto);

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
    const dto = new LogoutRequestDTO(req.refreshTokenJwt!);
    const type = req.tokenPayload!.type;

    const { message } = await this.authService.logout({
      type,
      refreshToken: dto.refreshToken
    });

    this.clearCookie(res, REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieSharedOptions);

    this.sendResponse<LogoutResponseDTO>({
      res,
      message
    });
  }

  @AutoBind()
  async refreshToken(req: Request, res: Response) {
    const dto = new RefreshTokenRequestDTO(req.refreshTokenJwt!);
    const { userId, exp, type } = req.tokenPayload!;

    const { accessToken, refreshToken } = await this.authService.refreshToken({
      refreshToken: dto.refreshToken,
      userId,
      exp,
      type
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
  async verifyEmail(req: Request<ParamsDictionary, object, VerifyEmailRequestDTO>, res: Response) {
    const dto = new VerifyEmailRequestDTO(req.body);
    const userId = this.getUserId(req);

    const { message } = await this.authService.verifyEmail({ userId, token: dto.token });

    this.sendResponse<VerifyEmailResponseDTO>({
      res,
      message
    });
  }

  @AutoBind()
  async resendVerifyEmail(req: Request, res: Response) {
    const userId = this.getUserId(req);

    const { message } = await this.authService.resendVerifyEmail({ userId });

    this.sendResponse<ResendVerifyEmailResponseDTO>({
      res,
      message
    });
  }

  @AutoBind()
  async forgotPassword(req: Request<ParamsDictionary, object, ForgotPasswordRequestDTO>, res: Response) {
    const dto = new ForgotPasswordRequestDTO(req.body);

    const { message } = await this.authService.forgotPassword(dto);

    this.sendResponse<ForgotPasswordResponseDTO>({
      res,
      message
    });
  }

  @AutoBind()
  async resetPassword(req: Request<ParamsDictionary, object, ResetPasswordRequestDTO>, res: Response) {
    const dto = new ResetPasswordRequestDTO(req.body);
    const userId = this.getUserId(req);

    const { message } = await this.authService.resetPassword({ ...dto, userId });

    this.sendResponse<ResetPasswordResponseDTO>({
      res,
      message
    });
  }

  @AutoBind()
  async changePassword(req: Request<ParamsDictionary, object, ChangePasswordRequestDTO>, res: Response) {
    const dto = new ChangePasswordRequestDTO(req.body);
    const userId = this.getUserId(req);

    const { message } = await this.authService.changePassword({ ...dto, userId });

    this.sendResponse<ChangePasswordResponseDTO>({
      res,
      message
    });
  }
}
