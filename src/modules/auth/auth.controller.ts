import { REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieSharedOptions, refreshTokenMaxAgeMs } from '@/constants';
import { Injectable } from '@/decorators';
import { ETokenType, TokenPayload } from '@/interfaces';
import {
  AuthService,
  BaseController,
  ChangePasswordRequestDTO,
  ChangePasswordResponseDTO,
  EmailAlreadyExistsException,
  EUserVerificationStatus,
  ForgotPasswordRequestDTO,
  ForgotPasswordResponseDTO,
  InvalidEmailOrPasswordException,
  InvalidTokenAuthFailureException,
  InvalidTokenBadRequestException,
  LoginRequestDTO,
  LoginResponseDTO,
  LogoutRequestDTO,
  LogoutResponseDTO,
  RefreshTokenRequestDTO,
  RefreshTokenResponseDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
  ResendVerifyEmailResponseDTO,
  ResetPasswordRequestDTO,
  ResetPasswordResponseDTO,
  UserAlreadyVerifiedException,
  UserNotFoundException,
  UsersService,
  VerifyEmailRequestDTO,
  VerifyEmailResponseDTO
} from '@/modules';
import { Created } from '@/providers';
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

@Injectable()
export class AuthController extends BaseController implements IAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {
    super();
  }

  register = async (req: Request<ParamsDictionary, object, RegisterRequestDTO>, res: Response) => {
    const dto = new RegisterRequestDTO(req.body);

    const existingUser = await this.usersService.findUserByEmail(dto.email);

    if (existingUser) {
      throw EmailAlreadyExistsException;
    }

    const user = await this.authService.register(dto);

    this.sendResponse<RegisterResponseDTO>({
      res,
      instance: Created,
      data: user,
      message: 'User registered successfully'
    });
  };

  login = async (req: Request<ParamsDictionary, object, LoginRequestDTO>, res: Response) => {
    const dto = new LoginRequestDTO(req.body);

    const existingUser = await this.usersService.findUserByEmail(dto.email);

    if (!existingUser) {
      throw InvalidEmailOrPasswordException;
    }

    const { accessToken, refreshToken } = await this.authService.login(dto, existingUser);

    this.setCookie(res, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      ...refreshTokenCookieSharedOptions,
      maxAge: refreshTokenMaxAgeMs(refreshToken)
    });

    this.sendResponse<LoginResponseDTO>({
      res,
      data: { accessToken },
      message: 'Login successfully'
    });
  };

  logout = async (req: Request, res: Response) => {
    const dto = new LogoutRequestDTO(req.refreshTokenJwt!);
    const { type } = req.tokenPayload as TokenPayload;

    const findRefreshToken = await this.authService.findRefreshTokenByToken(dto.refreshToken);

    if (!findRefreshToken || type !== ETokenType.REFRESH_TOKEN) {
      throw InvalidTokenAuthFailureException;
    }

    const { message } = await this.authService.logout(dto);

    this.clearCookie(res, REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieSharedOptions);

    this.sendResponse<LogoutResponseDTO>({
      res,
      message
    });
  };

  refreshToken = async (req: Request, res: Response) => {
    const dto = new RefreshTokenRequestDTO(req.refreshTokenJwt!);
    const { userId, exp, type } = req.tokenPayload as TokenPayload;

    const findRefreshToken = await this.authService.findRefreshTokenByToken(dto.refreshToken);

    if (!findRefreshToken || type !== ETokenType.REFRESH_TOKEN) {
      throw InvalidTokenAuthFailureException;
    }

    const { accessToken, refreshToken } = await this.authService.refreshToken({
      refreshToken: dto.refreshToken,
      userId,
      exp
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
  };

  verifyEmail = async (req: Request<ParamsDictionary, object, VerifyEmailRequestDTO>, res: Response) => {
    const dto = new VerifyEmailRequestDTO(req.body);
    const userId = this.getUserId(req);

    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw UserNotFoundException;
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw UserAlreadyVerifiedException;
    }

    if (user.emailVerificationToken !== dto.token) {
      throw InvalidTokenBadRequestException;
    }

    const { message } = await this.authService.verifyEmail(userId);

    this.sendResponse<VerifyEmailResponseDTO>({
      res,
      message
    });
  };

  resendVerifyEmail = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);

    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw UserNotFoundException;
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw UserAlreadyVerifiedException;
    }

    const { message } = await this.authService.resendVerifyEmail({ userId, name: user.name, email: user.email });

    this.sendResponse<ResendVerifyEmailResponseDTO>({
      res,
      message
    });
  };

  forgotPassword = async (req: Request<ParamsDictionary, object, ForgotPasswordRequestDTO>, res: Response) => {
    const dto = new ForgotPasswordRequestDTO(req.body);

    const existingUser = await this.usersService.findUserByEmail(dto.email);

    if (!existingUser) {
      throw InvalidEmailOrPasswordException;
    }

    const { message } = await this.authService.forgotPassword({
      userId: existingUser._id.toString(),
      name: existingUser.name,
      email: dto.email
    });

    this.sendResponse<ForgotPasswordResponseDTO>({
      res,
      message
    });
  };

  resetPassword = async (req: Request<ParamsDictionary, object, ResetPasswordRequestDTO>, res: Response) => {
    const dto = new ResetPasswordRequestDTO(req.body);
    const userId = this.getUserId(req);

    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw UserNotFoundException;
    }

    if (user.forgotPasswordToken !== dto.token) {
      throw InvalidTokenBadRequestException;
    }

    const { message } = await this.authService.resetPassword({ ...dto, userId });

    this.sendResponse<ResetPasswordResponseDTO>({
      res,
      message
    });
  };

  changePassword = async (req: Request<ParamsDictionary, object, ChangePasswordRequestDTO>, res: Response) => {
    const dto = new ChangePasswordRequestDTO(req.body);
    const userId = this.getUserId(req);

    const { message } = await this.authService.changePassword({ ...dto, userId });

    this.sendResponse<ChangePasswordResponseDTO>({
      res,
      message
    });
  };
}
