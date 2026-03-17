import HTTP_STATUS from '@/constants/httpStatus.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { EUserVerificationStatus } from '@/enums/users.enum';
import { ErrorWithStatus } from '@/models/error.model';
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
import authService from '@/services/auth.service';
import usersService from '@/services/users.service';
import { AccessTokenPayload, ForgotPasswordTokenPayload, RefreshTokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

class AuthController {
  constructor() {}

  async register(req: Request<{}, {}, IRegisterRequestBody>, res: Response) {
    const { name, email, password, dateOfBirth } = req.body;

    const user = await authService.register({ name, email, password, dateOfBirth });

    return res.status(HTTP_STATUS.CREATED).json({
      data: user,
      message: 'User registered successfully'
    });
  }

  async login(req: Request<{}, {}, ILoginRequestBody>, res: Response) {
    const { email, password } = req.body;
    const user = req.user;

    const { accessToken, refreshToken } = await authService.login({ email, password }, user);

    // Trả về token
    return res.status(HTTP_STATUS.OK).json({
      accessToken,
      refreshToken
    });
  }

  async logout(req: Request<{}, {}, ILogoutRequestBody>, res: Response) {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Logout successfully'
    });
  }

  async refreshToken(req: Request<{}, {}, IRefreshTokenRequestBody>, res: Response) {
    const { refreshToken: refreshTokenBody } = req.body;
    const { userId, exp } = req.refreshTokenPayload as RefreshTokenPayload;

    const { accessToken, refreshToken } = await authService.refreshToken({ userId, refreshTokenBody, exp });

    return res.status(HTTP_STATUS.OK).json({
      accessToken,
      refreshToken
    });
  }

  async verifyEmail(req: Request<{}, {}, IVerifyEmailRequestBody>, res: Response) {
    const { token } = req.body;
    const userId = req.emailVerificationTokenPayload?.userId;

    if (!userId) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const user = await usersService.findUserById(userId);

    if (!user) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_ALREADY_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    if (user.emailVerificationToken !== token) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.EMAIL_VERIFICATION_TOKEN_IS_INVALID,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    await authService.verifyEmail(userId);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Email verified successfully'
    });
  }

  async resendVerifyEmail(req: Request, res: Response) {
    const userId = req.accessTokenPayload?.userId;

    if (!userId) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.AUTHORIZATION_IS_REQUIRED,
        status: HTTP_STATUS.UNAUTHORIZED
      });
    }

    const user = await usersService.findUserById(userId);

    if (!user) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_ALREADY_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    await authService.resendVerifyEmail({ userId, name: user.name, email: user.email });

    return res.status(HTTP_STATUS.OK).json({
      message: 'Email verification sent successfully'
    });
  }

  async forgotPassword(req: Request<{}, {}, IForgotPasswordRequestBody>, res: Response) {
    const user = req.user as IUser;

    await authService.forgotPassword({ userId: user._id!.toString(), name: user.name, email: user.email });

    return res.status(HTTP_STATUS.OK).json({
      message: 'Password reset email sent successfully'
    });
  }

  async resetPassword(req: Request<{}, {}, IResetPasswordRequestBody>, res: Response) {
    const { token, password } = req.body;
    const { userId } = req.forgotPasswordTokenPayload as ForgotPasswordTokenPayload;

    if (!userId) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const user = await usersService.findUserById(userId);

    if (!user) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    if (user.forgotPasswordToken !== token) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_INVALID,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    await authService.resetPassword({ userId, password });

    return res.status(HTTP_STATUS.OK).json({
      message: 'Password reset successfully'
    });
  }

  async changePassword(req: Request<{}, {}, IChangePasswordRequestBody>, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;
    const { password: newPassword } = req.body;

    await authService.changePassword({ userId, newPassword });

    return res.status(HTTP_STATUS.OK).json({
      message: 'Password changed successfully'
    });
  }
}

export default new AuthController();
