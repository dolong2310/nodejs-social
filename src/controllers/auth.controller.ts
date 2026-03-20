import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BaseController } from '@/controllers/base.controller';
import { ETokenType } from '@/enums/token.enum';
import { EUserVerificationStatus } from '@/enums/users.enum';
import {
  ChangePasswordRequestDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
  VerifyEmailRequestDTO
} from '@/dtos/requests/auth.request.dto';
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
} from '@/dtos/responses/auth.response.dto';
import { AuthFailureError, BadRequestError, NotFoundError } from '@/responses/error.response';
import { Created } from '@/responses/success.response';
import { IAuthService } from '@/services/auth.service';
import { IUsersService } from '@/services/users.service';
import { TokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IAuthController {
  register(req: Request<ParamsDictionary, object, RegisterRequestDTO>, res: Response): Promise<void>;
  login(req: Request<ParamsDictionary, object, LoginRequestDTO>, res: Response): Promise<void>;
  logout(req: Request<ParamsDictionary, object, LogoutRequestDTO>, res: Response): Promise<void>;
  refreshToken(req: Request<ParamsDictionary, object, RefreshTokenRequestDTO>, res: Response): Promise<void>;
  verifyEmail(req: Request<ParamsDictionary, object, VerifyEmailRequestDTO>, res: Response): Promise<void>;
  resendVerifyEmail(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request<ParamsDictionary, object, ForgotPasswordRequestDTO>, res: Response): Promise<void>;
  resetPassword(req: Request<ParamsDictionary, object, ResetPasswordRequestDTO>, res: Response): Promise<void>;
  changePassword(req: Request<ParamsDictionary, object, ChangePasswordRequestDTO>, res: Response): Promise<void>;
}

class AuthController extends BaseController implements IAuthController {
  constructor(
    private readonly authService: IAuthService,
    private readonly usersService: IUsersService
  ) {
    super();
  }

  register = async (req: Request<ParamsDictionary, object, RegisterRequestDTO>, res: Response) => {
    const dto = new RegisterRequestDTO(req.body);

    const existingUser = await this.usersService.findUserByEmail(dto.email);

    if (existingUser) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.EMAIL_ALREADY_EXISTS);
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
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
    }

    const tokens = await this.authService.login(dto, existingUser);

    this.sendResponse<LoginResponseDTO>({
      res,
      data: tokens,
      message: 'Login successfully'
    });
  };

  logout = async (req: Request<ParamsDictionary, object, LogoutRequestDTO>, res: Response) => {
    const dto = new LogoutRequestDTO(req.body);
    const { type } = req.tokenPayload as TokenPayload;

    const findRefreshToken = await this.authService.findRefreshTokenByToken(dto.refreshToken);

    if (!findRefreshToken || type !== ETokenType.REFRESH_TOKEN) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
    }

    const { message } = await this.authService.logout(dto);

    this.sendResponse<LogoutResponseDTO>({
      res,
      message
    });
  };

  refreshToken = async (req: Request<ParamsDictionary, object, RefreshTokenRequestDTO>, res: Response) => {
    const dto = new RefreshTokenRequestDTO(req.body);
    const { userId, exp, type } = req.tokenPayload as TokenPayload;

    const findRefreshToken = await this.authService.findRefreshTokenByToken(dto.refreshToken);

    if (!findRefreshToken || type !== ETokenType.REFRESH_TOKEN) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
    }

    const tokens = await this.authService.refreshToken({
      refreshToken: dto.refreshToken,
      userId,
      exp
    });

    this.sendResponse<RefreshTokenResponseDTO>({
      res,
      data: tokens,
      message: 'Refresh token successfully'
    });
  };

  verifyEmail = async (req: Request<ParamsDictionary, object, VerifyEmailRequestDTO>, res: Response) => {
    const dto = new VerifyEmailRequestDTO(req.body);
    const userId = this.getUserId(req);

    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.USER_ALREADY_VERIFIED);
    }

    if (user.emailVerificationToken !== dto.token) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
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
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.USER_ALREADY_VERIFIED);
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
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
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
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    if (user.forgotPasswordToken !== dto.token) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
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

export default AuthController;
