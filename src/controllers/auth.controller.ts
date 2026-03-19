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
import { AuthFailureError, BadRequestError, NotFoundError } from '@/responses/error.response';
import { Created, OK } from '@/responses/success.response';
import { IAuthService } from '@/services/auth.service';
import { IUsersService } from '@/services/users.service';
import { TokenPayload } from '@/types/token.type';
import { NextFunction, Request, Response } from 'express';

export interface IAuthController {
  register(req: Request<{}, {}, IRegisterRequestBody>, res: Response): Promise<void>;
  login(req: Request<{}, {}, ILoginRequestBody>, res: Response): Promise<void>;
  logout(req: Request<{}, {}, ILogoutRequestBody>, res: Response): Promise<void>;
  refreshToken(req: Request<{}, {}, IRefreshTokenRequestBody>, res: Response): Promise<void>;
  verifyEmail(req: Request<{}, {}, IVerifyEmailRequestBody>, res: Response): Promise<void>;
  resendVerifyEmail(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request<{}, {}, IForgotPasswordRequestBody>, res: Response): Promise<void>;
  resetPassword(req: Request<{}, {}, IResetPasswordRequestBody>, res: Response): Promise<void>;
  changePassword(req: Request<{}, {}, IChangePasswordRequestBody>, res: Response): Promise<void>;
}

class AuthController extends BaseController implements IAuthController {
  constructor(
    private readonly authService: IAuthService,
    private readonly usersService: IUsersService
  ) {
    super();
  }

  register = async (req: Request<{}, {}, IRegisterRequestBody>, res: Response) => {
    const { name, email, password, dateOfBirth } = req.body;

    const existingUser = await this.usersService.findUserByEmail(email);

    if (existingUser) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.EMAIL_ALREADY_EXISTS);
    }

    const user = await this.authService.register({ name, email, password, dateOfBirth });

    new Created({
      data: user,
      message: 'User registered successfully'
    }).send(res);
  };

  login = async (req: Request<{}, {}, ILoginRequestBody>, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await this.usersService.findUserByEmail(email);

    if (!existingUser) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
    }

    const { accessToken, refreshToken } = await this.authService.login({ email, password }, existingUser);

    // Trả về token
    new OK({
      data: { accessToken, refreshToken },
      message: 'Login successfully'
    }).send(res);
  };

  logout = async (req: Request<{}, {}, ILogoutRequestBody>, res: Response) => {
    const { refreshToken } = req.body;
    const { type } = req.tokenPayload as TokenPayload;

    const findRefreshToken = await this.authService.findRefreshTokenByToken(refreshToken);

    if (!findRefreshToken || type !== ETokenType.REFRESH_TOKEN) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
    }

    await this.authService.logout(refreshToken);

    new OK({
      message: 'Logout successfully'
    }).send(res);
  };

  refreshToken = async (req: Request<{}, {}, IRefreshTokenRequestBody>, res: Response) => {
    const { refreshToken: refreshTokenBody } = req.body;
    const { userId, exp, type } = req.tokenPayload as TokenPayload;

    const findRefreshToken = await this.authService.findRefreshTokenByToken(refreshTokenBody);

    if (!findRefreshToken || type !== ETokenType.REFRESH_TOKEN) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
    }

    const { accessToken, refreshToken } = await this.authService.refreshToken({ userId, refreshTokenBody, exp });

    new OK({
      data: { accessToken, refreshToken },
      message: 'Refresh token successfully'
    }).send(res);
  };

  verifyEmail = async (req: Request<{}, {}, IVerifyEmailRequestBody>, res: Response) => {
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

    await this.authService.verifyEmail(userId);

    new OK({
      message: 'Email verified successfully'
    }).send(res);
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

    await this.authService.resendVerifyEmail({ userId, name: user.name, email: user.email });

    new OK({
      message: 'Email verification sent successfully'
    }).send(res);
  };

  forgotPassword = async (req: Request<{}, {}, IForgotPasswordRequestBody>, res: Response) => {
    const { email } = req.body;

    const existingUser = await this.usersService.findUserByEmail(email);

    if (!existingUser) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
    }

    await this.authService.forgotPassword({
      userId: existingUser._id!.toString(),
      name: existingUser.name,
      email: existingUser.email
    });

    new OK({
      message: 'Password reset email sent successfully'
    }).send(res);
  };

  resetPassword = async (req: Request<{}, {}, IResetPasswordRequestBody>, res: Response) => {
    const { token, password } = req.body;
    const userId = this.getUserId(req);

    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    if (user.forgotPasswordToken !== token) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
    }

    await this.authService.resetPassword({ userId, password });

    new OK({
      message: 'Password reset successfully'
    }).send(res);
  };

  changePassword = async (req: Request<{}, {}, IChangePasswordRequestBody>, res: Response) => {
    const userId = this.getUserId(req);
    const { password: newPassword } = req.body;

    await this.authService.changePassword({ userId, newPassword });

    new OK({
      message: 'Password changed successfully'
    }).send(res);
  };
}

export default AuthController;
