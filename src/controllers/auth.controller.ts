import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BaseController } from '@/controllers/base.controller';
import { ETokenType } from '@/enums/token.enum';
import { EUserVerificationStatus } from '@/enums/users.enum';
import {
  IChangePasswordRequestBody,
  IForgotPasswordRequestBody,
  ILoginRequestBody,
  ILogoutRequestBody,
  IRefreshTokenRequestBody,
  IRegisterRequestBody,
  IResetPasswordRequestBody,
  IVerifyEmailRequestBody
} from '@/models/requests/auth.request';
import {
  IChangePasswordResponse,
  IForgotPasswordResponse,
  ILoginResponse,
  ILogoutResponse,
  IRefreshTokenResponse,
  IRegisterResponse,
  IResendVerifyEmailResponse,
  IResetPasswordResponse,
  IVerifyEmailResponse
} from '@/models/responses/auth.response';
import { AuthFailureError, BadRequestError, NotFoundError } from '@/responses/error.response';
import { Created } from '@/responses/success.response';
import { IAuthService } from '@/services/auth.service';
import { IUsersService } from '@/services/users.service';
import { TokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IAuthController {
  register(req: Request<ParamsDictionary, object, IRegisterRequestBody>, res: Response): Promise<void>;
  login(req: Request<ParamsDictionary, object, ILoginRequestBody>, res: Response): Promise<void>;
  logout(req: Request<ParamsDictionary, object, ILogoutRequestBody>, res: Response): Promise<void>;
  refreshToken(req: Request<ParamsDictionary, object, IRefreshTokenRequestBody>, res: Response): Promise<void>;
  verifyEmail(req: Request<ParamsDictionary, object, IVerifyEmailRequestBody>, res: Response): Promise<void>;
  resendVerifyEmail(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request<ParamsDictionary, object, IForgotPasswordRequestBody>, res: Response): Promise<void>;
  resetPassword(req: Request<ParamsDictionary, object, IResetPasswordRequestBody>, res: Response): Promise<void>;
  changePassword(req: Request<ParamsDictionary, object, IChangePasswordRequestBody>, res: Response): Promise<void>;
}

class AuthController extends BaseController implements IAuthController {
  constructor(
    private readonly authService: IAuthService,
    private readonly usersService: IUsersService
  ) {
    super();
  }

  register = async (req: Request<ParamsDictionary, object, IRegisterRequestBody>, res: Response) => {
    const { name, email, password, dateOfBirth } = req.body;

    const existingUser = await this.usersService.findUserByEmail(email);

    if (existingUser) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.EMAIL_ALREADY_EXISTS);
    }

    const user = await this.authService.register({ name, email, password, dateOfBirth });

    this.sendResponse<IRegisterResponse>({
      res,
      instance: Created,
      data: user,
      message: 'User registered successfully'
    });
  };

  login = async (req: Request<ParamsDictionary, object, ILoginRequestBody>, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await this.usersService.findUserByEmail(email);

    if (!existingUser) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
    }

    const { accessToken, refreshToken } = await this.authService.login({ email, password }, existingUser);

    this.sendResponse<ILoginResponse>({
      res,
      data: { accessToken, refreshToken },
      message: 'Login successfully'
    });
  };

  logout = async (req: Request<ParamsDictionary, object, ILogoutRequestBody>, res: Response) => {
    const { refreshToken } = req.body;
    const { type } = req.tokenPayload as TokenPayload;

    const findRefreshToken = await this.authService.findRefreshTokenByToken(refreshToken);

    if (!findRefreshToken || type !== ETokenType.REFRESH_TOKEN) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
    }

    const { message } = await this.authService.logout({ refreshToken });

    this.sendResponse<ILogoutResponse>({
      res,
      message
    });
  };

  refreshToken = async (req: Request<ParamsDictionary, object, IRefreshTokenRequestBody>, res: Response) => {
    const { refreshToken: refreshTokenBody } = req.body;
    const { userId, exp, type } = req.tokenPayload as TokenPayload;

    const findRefreshToken = await this.authService.findRefreshTokenByToken(refreshTokenBody);

    if (!findRefreshToken || type !== ETokenType.REFRESH_TOKEN) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
    }

    const { accessToken, refreshToken } = await this.authService.refreshToken({
      userId,
      refreshToken: refreshTokenBody,
      exp
    });

    this.sendResponse<IRefreshTokenResponse>({
      res,
      data: { accessToken, refreshToken },
      message: 'Refresh token successfully'
    });
  };

  verifyEmail = async (req: Request<ParamsDictionary, object, IVerifyEmailRequestBody>, res: Response) => {
    const { token } = req.body;
    const userId = this.getUserId(req);

    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.USER_ALREADY_VERIFIED);
    }

    if (user.emailVerificationToken !== token) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
    }

    const { message } = await this.authService.verifyEmail(userId);

    this.sendResponse<IVerifyEmailResponse>({
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

    this.sendResponse<IResendVerifyEmailResponse>({
      res,
      message
    });
  };

  forgotPassword = async (req: Request<ParamsDictionary, object, IForgotPasswordRequestBody>, res: Response) => {
    const { email } = req.body;

    const existingUser = await this.usersService.findUserByEmail(email);

    if (!existingUser) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
    }

    const { message } = await this.authService.forgotPassword({
      userId: existingUser._id!.toString(),
      name: existingUser.name,
      email: existingUser.email
    });

    this.sendResponse<IForgotPasswordResponse>({
      res,
      message
    });
  };

  resetPassword = async (req: Request<ParamsDictionary, object, IResetPasswordRequestBody>, res: Response) => {
    const { token, password, confirmPassword } = req.body;
    const userId = this.getUserId(req);

    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    if (user.forgotPasswordToken !== token) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
    }

    const { message } = await this.authService.resetPassword({ userId, token, password, confirmPassword });

    this.sendResponse<IResetPasswordResponse>({
      res,
      message
    });
  };

  changePassword = async (req: Request<ParamsDictionary, object, IChangePasswordRequestBody>, res: Response) => {
    const userId = this.getUserId(req);
    const { password, confirmPassword } = req.body;

    const { message } = await this.authService.changePassword({ userId, password, confirmPassword });

    this.sendResponse<IChangePasswordResponse>({
      res,
      message
    });
  };
}

export default AuthController;
