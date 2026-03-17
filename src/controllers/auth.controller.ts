import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { EUserVerificationStatus } from '@/enums/users.enum';
import { AuthFailureError, BadRequestError, NotFoundError } from '@/models/error.response';
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
import { IUser } from '@/models/schemas/user.schema';
import { Created, OK } from '@/models/success.response';
import authService from '@/services/auth.service';
import usersService from '@/services/users.service';
import { AccessTokenPayload, ForgotPasswordTokenPayload, RefreshTokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

class AuthController {
  constructor() {}

  async register(req: Request<{}, {}, IRegisterRequestBody>, res: Response) {
    const { name, email, password, dateOfBirth } = req.body;

    const user = await authService.register({ name, email, password, dateOfBirth });

    return new Created({
      data: user,
      message: 'User registered successfully'
    }).send(res);
  }

  async login(req: Request<{}, {}, ILoginRequestBody>, res: Response) {
    const { email, password } = req.body;
    const user = req.user;

    const { accessToken, refreshToken } = await authService.login({ email, password }, user);

    // Trả về token
    return new OK({
      data: { accessToken, refreshToken },
      message: 'Login successfully'
    }).send(res);
  }

  async logout(req: Request<{}, {}, ILogoutRequestBody>, res: Response) {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken);

    return new OK({
      message: 'Logout successfully'
    }).send(res);
  }

  async refreshToken(req: Request<{}, {}, IRefreshTokenRequestBody>, res: Response) {
    const { refreshToken: refreshTokenBody } = req.body;
    const { userId, exp } = req.refreshTokenPayload as RefreshTokenPayload;

    const { accessToken, refreshToken } = await authService.refreshToken({ userId, refreshTokenBody, exp });

    return new OK({
      data: { accessToken, refreshToken },
      message: 'Refresh token successfully'
    }).send(res);
  }

  async verifyEmail(req: Request<{}, {}, IVerifyEmailRequestBody>, res: Response) {
    const { token } = req.body;
    const userId = req.emailVerificationTokenPayload?.userId;

    if (!userId) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    const user = await usersService.findUserById(userId);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.USER_ALREADY_VERIFIED);
    }

    if (user.emailVerificationToken !== token) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.EMAIL_VERIFICATION_TOKEN_IS_INVALID);
    }

    await authService.verifyEmail(userId);

    return new OK({
      message: 'Email verified successfully'
    }).send(res);
  }

  async resendVerifyEmail(req: Request, res: Response) {
    const userId = req.accessTokenPayload?.userId;

    if (!userId) {
      throw new AuthFailureError();
    }

    const user = await usersService.findUserById(userId);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.USER_ALREADY_VERIFIED);
    }

    await authService.resendVerifyEmail({ userId, name: user.name, email: user.email });

    return new OK({
      message: 'Email verification sent successfully'
    }).send(res);
  }

  async forgotPassword(req: Request<{}, {}, IForgotPasswordRequestBody>, res: Response) {
    const user = req.user as IUser;

    await authService.forgotPassword({ userId: user._id!.toString(), name: user.name, email: user.email });

    return new OK({
      message: 'Password reset email sent successfully'
    }).send(res);
  }

  async resetPassword(req: Request<{}, {}, IResetPasswordRequestBody>, res: Response) {
    const { token, password } = req.body;
    const { userId } = req.forgotPasswordTokenPayload as ForgotPasswordTokenPayload;

    if (!userId) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    const user = await usersService.findUserById(userId);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    if (user.forgotPasswordToken !== token) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_INVALID);
    }

    await authService.resetPassword({ userId, password });

    return new OK({
      message: 'Password reset successfully'
    }).send(res);
  }

  async changePassword(req: Request<{}, {}, IChangePasswordRequestBody>, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;
    const { password: newPassword } = req.body;

    await authService.changePassword({ userId, newPassword });

    return new OK({
      message: 'Password changed successfully'
    }).send(res);
  }
}

export default new AuthController();
