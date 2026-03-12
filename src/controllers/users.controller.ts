import HTTP_STATUS from '@/constants/httpStatus.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { UserVerificationStatus } from '@/enums/users.enum';
import { ErrorWithStatus } from '@/models/error.model';
import {
  IChangePasswordRequestBody,
  IForgotPasswordRequestBody,
  IGetUserProfileRequestParams,
  ILoginRequestBody,
  ILogoutRequestBody,
  IRefreshTokenRequestBody,
  IRegisterRequestBody,
  IResetPasswordRequestBody,
  IUpdateMeRequestBody,
  IVerifyEmailRequestBody
} from '@/models/requests/user.request';
import { IUser } from '@/models/schemas/user.schema';
import usersService from '@/services/users.service';
import { AccessTokenPayload, ForgotPasswordTokenPayload, RefreshTokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

class UserController {
  constructor() {}

  async register(req: Request<{}, {}, IRegisterRequestBody>, res: Response) {
    const { name, email, password, dateOfBirth } = req.body;

    const user = await usersService.register({ name, email, password, dateOfBirth });

    return res.status(HTTP_STATUS.CREATED).json({
      data: user,
      message: 'User registered successfully'
    });
  }

  async login(req: Request<{}, {}, ILoginRequestBody>, res: Response) {
    const { email, password } = req.body;
    const user = req.user;

    const { accessToken, refreshToken } = await usersService.login({ email, password }, user);

    // Trả về token
    return res.status(HTTP_STATUS.OK).json({
      accessToken,
      refreshToken
    });
  }

  async logout(req: Request<{}, {}, ILogoutRequestBody>, res: Response) {
    const { refreshToken } = req.body;

    await usersService.logout(refreshToken);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Logout successfully'
    });
  }

  async refreshToken(req: Request<{}, {}, IRefreshTokenRequestBody>, res: Response) {
    const { refreshToken: refreshTokenBody } = req.body;
    const { userId, exp } = req.refreshTokenPayload as RefreshTokenPayload;

    const { accessToken, refreshToken } = await usersService.refreshToken({ userId, refreshTokenBody, exp });

    return res.status(HTTP_STATUS.OK).json({
      accessToken,
      refreshToken
    });
  }

  async verifyEmail(req: Request<{}, {}, IVerifyEmailRequestBody>, res: Response) {
    const { emailVerificationToken } = req.body;
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

    if (user.verificationStatus === UserVerificationStatus.VERIFIED) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_ALREADY_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    if (user.emailVerificationToken !== emailVerificationToken) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.EMAIL_VERIFICATION_TOKEN_IS_INVALID,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    await usersService.verifyEmail(userId);

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

    if (user.verificationStatus === UserVerificationStatus.VERIFIED) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_ALREADY_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    await usersService.resendVerifyEmail(userId);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Email verification sent successfully'
    });
  }

  async forgotPassword(req: Request<{}, {}, IForgotPasswordRequestBody>, res: Response) {
    const user = req.user as IUser;

    await usersService.forgotPassword(user._id!.toString());

    return res.status(HTTP_STATUS.OK).json({
      message: 'Password reset email sent successfully'
    });
  }

  async resetPassword(req: Request<{}, {}, IResetPasswordRequestBody>, res: Response) {
    const { forgotPasswordToken, newPassword } = req.body;
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

    if (user.forgotPasswordToken !== forgotPasswordToken) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_INVALID,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    await usersService.resetPassword({ userId, newPassword });

    return res.status(HTTP_STATUS.OK).json({
      message: 'Password reset successfully'
    });
  }

  async changePassword(req: Request<{}, {}, IChangePasswordRequestBody>, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;
    const { password: newPassword } = req.body;

    await usersService.changePassword({ userId, newPassword });

    return res.status(HTTP_STATUS.OK).json({
      message: 'Password changed successfully'
    });
  }

  async getMe(req: Request, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;

    const user = await usersService.getMe(userId);

    if (!user) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      data: user,
      message: 'Get me successfully'
    });
  }

  async updateMe(req: Request<{}, {}, IUpdateMeRequestBody>, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;
    const { body } = req;

    const _body = body.dateOfBirth ? { ...body, dateOfBirth: new Date(body.dateOfBirth) } : body;

    const updatedUser = await usersService.updateMe(userId, _body as IUpdateMeRequestBody & { dateOfBirth?: Date });

    return res.status(HTTP_STATUS.OK).json({
      data: updatedUser,
      message: 'Update me successfully'
    });
  }

  async getUserProfile(req: Request<IGetUserProfileRequestParams>, res: Response) {
    const { username } = req.params;

    const user = await usersService.getUserProfile(username);

    if (!user) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      data: user,
      message: 'Get user profile successfully'
    });
  }
}

export default new UserController();
