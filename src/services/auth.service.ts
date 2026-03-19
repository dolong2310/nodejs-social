import { envConfig } from '@/config';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ETokenType } from '@/enums/token.enum';
import { EUserVerificationStatus } from '@/enums/users.enum';
import {
  IChangePasswordRequestBody,
  IForgotPasswordRequestBody,
  ILoginRequestBody,
  ILogoutRequestBody,
  IRefreshTokenRequestBody,
  IRegisterRequestBody,
  IResetPasswordRequestBody
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
import { IRefreshToken } from '@/models/schemas/refreshToken.schema';
import { IUser } from '@/models/schemas/user.schema';
import { IUserRepository } from '@/repositories/user.repository';
import { BadRequestError } from '@/responses/error.response';
import { BaseService } from '@/services/base.service';
import { EEmailTemplate, IEmailService } from '@/services/email.service';
import { ITokenService } from '@/services/token.service';
import { comparePassword, hashPassword } from '@/utils/helper.util';
import { omit } from 'lodash-es';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export interface IAuthService {
  findRefreshTokenByToken(token: string): Promise<IRefreshToken | null>;
  register(body: IRegisterRequestBody, options: { autoLogin: true }): Promise<ILoginResponse>;
  register(body: IRegisterRequestBody, options?: { autoLogin?: false }): Promise<IRegisterResponse>;
  register(body: IRegisterRequestBody, options?: { autoLogin?: boolean }): Promise<IRegisterResponse | ILoginResponse>;
  login(body: ILoginRequestBody, user: IUser): Promise<ILoginResponse>;
  logout(refreshToken: ILogoutRequestBody): Promise<ILogoutResponse>;
  refreshToken(payload: IRefreshTokenRequestBody & { userId: string; exp: number }): Promise<IRefreshTokenResponse>;
  verifyEmail(userId: string): Promise<IVerifyEmailResponse>;
  resendVerifyEmail(payload: { userId: string; name: string; email: string }): Promise<IResendVerifyEmailResponse>;
  forgotPassword(
    payload: IForgotPasswordRequestBody & { userId: string; name: string }
  ): Promise<IForgotPasswordResponse>;
  resetPassword(payload: IResetPasswordRequestBody & { userId: string }): Promise<IResetPasswordResponse>;
  changePassword(payload: IChangePasswordRequestBody & { userId: string }): Promise<IChangePasswordResponse>;
}

class AuthService extends BaseService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly emailService: IEmailService
  ) {
    super();
  }

  findRefreshTokenByToken(token: string): Promise<IRefreshToken | null> {
    return this.userRepository.findRefreshToken(token);
  }

  // Nếu autoLogin là true, trả về accessToken và refreshToken.
  async register(body: IRegisterRequestBody, options: { autoLogin: true }): Promise<ILoginResponse>;
  // Nếu autoLogin là false hoặc không truyền options, trả về thông tin user
  async register(body: IRegisterRequestBody, options?: { autoLogin?: false }): Promise<IRegisterResponse>;
  // Overload Functions
  async register(
    body: IRegisterRequestBody,
    options?: { autoLogin?: boolean }
  ): Promise<IRegisterResponse | ILoginResponse> {
    const { name, email, password, dateOfBirth } = body;
    const { autoLogin = false } = options ?? {};

    const userId = new ObjectId();

    // tạo email verification token
    const emailVerificationToken = await this.tokenService.signEmailVerificationToken({
      userId: userId.toString(),
      type: ETokenType.EMAIL_VERIFICATION_TOKEN
    });

    // gửi email xác thực
    // TIPS: khi gửi email mà không muốn tạo email mới thì chỉ cần thêm +1 vào cuối của email đó (ví dụ: test123@gmail.com -> test123+1@gmail.com)
    await this.emailService.sendEmail({
      toAddress: email,
      subject: 'Email Verification',
      body: {
        name,
        url: `${envConfig.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`,
        expiresIn: '1 hour',
        appName: 'Social Media App',
        supportUrl: 'https://www.google.com'
      },
      template: EEmailTemplate.VERIFY_EMAIL
    });

    const user = await this.userRepository.findByEmail(email);
    if (user) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await this.userRepository.create({
      userId: userId.toString(),
      name,
      email,
      password: hashedPassword,
      dateOfBirth: dateOfBirth,
      username: `user-${uuidv4()}`,
      emailVerificationToken,
      verificationStatus: EUserVerificationStatus.UNVERIFIED
    });

    if (autoLogin) {
      return this.login({ email, password }, newUser);
    }

    const result = omit(newUser, ['password', 'emailVerificationToken', 'forgotPasswordToken']);
    return this.replaceObjectIdToString<IRegisterResponse>(result);
  }

  async login({ password }: ILoginRequestBody, user: IUser): Promise<ILoginResponse> {
    const userId = user._id!.toString();

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
    }

    // Tạo cặp token JWT
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        type: ETokenType.ACCESS_TOKEN
      }),
      this.tokenService.signRefreshToken({
        userId,
        type: ETokenType.REFRESH_TOKEN
      })
    ]);

    // Lưu token vào database
    await this.userRepository.createRefreshToken(refreshToken, userId);

    return {
      accessToken,
      refreshToken
    };
  }

  async logout({ refreshToken }: ILogoutRequestBody): Promise<ILogoutResponse> {
    await this.userRepository.deleteRefreshToken(refreshToken);
    return { message: 'Logout successfully' };
  }

  async refreshToken({
    userId,
    refreshToken,
    exp
  }: IRefreshTokenRequestBody & { userId: string; exp: number }): Promise<IRefreshTokenResponse> {
    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        type: ETokenType.ACCESS_TOKEN
      }),
      this.tokenService.signRefreshToken({
        userId,
        type: ETokenType.REFRESH_TOKEN,
        exp
      })
    ]);

    await Promise.all([
      this.userRepository.deleteRefreshToken(refreshToken),
      this.userRepository.createRefreshToken(newRefreshToken, userId)
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async verifyEmail(userId: string): Promise<IVerifyEmailResponse> {
    await this.userRepository.update(userId, {
      emailVerificationToken: '',
      verificationStatus: EUserVerificationStatus.VERIFIED
    });
    return { message: 'Email verified successfully' };
  }

  async resendVerifyEmail({
    userId,
    name,
    email
  }: {
    userId: string;
    name: string;
    email: string;
  }): Promise<IResendVerifyEmailResponse> {
    const emailVerificationToken = await this.tokenService.signEmailVerificationToken({
      userId: userId.toString(),
      type: ETokenType.EMAIL_VERIFICATION_TOKEN
    });

    // gửi email xác thực
    await this.emailService.sendEmail({
      toAddress: email,
      subject: 'Email Verification',
      body: {
        name,
        url: `${envConfig.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`,
        expiresIn: '1 hour',
        appName: 'Social Media App',
        supportUrl: 'https://www.google.com'
      },
      template: EEmailTemplate.VERIFY_EMAIL
    });

    await this.userRepository.update(userId, {
      emailVerificationToken
    });

    return {
      message: 'Email verification sent successfully'
    };
  }

  async forgotPassword({
    userId,
    name,
    email
  }: IForgotPasswordRequestBody & {
    userId: string;
    name: string;
  }): Promise<IForgotPasswordResponse> {
    const forgotPasswordToken = await this.tokenService.signForgotPasswordToken({
      userId,
      type: ETokenType.FORGOT_PASSWORD_TOKEN
    });

    // gửi email xác thực
    await this.emailService.sendEmail({
      toAddress: email,
      subject: 'Forgot Password',
      body: {
        name,
        url: `${envConfig.FRONTEND_URL}/reset-password?token=${forgotPasswordToken}`,
        expiresIn: '1 hour',
        appName: 'Social Media App',
        supportUrl: 'https://www.google.com'
      },
      template: EEmailTemplate.FORGOT_PASSWORD
    });

    await this.userRepository.update(userId, {
      forgotPasswordToken
    });

    return {
      message: 'Forgot password sent successfully'
    };
  }

  async resetPassword({
    userId,
    password
  }: IResetPasswordRequestBody & { userId: string }): Promise<IResetPasswordResponse> {
    const hashedPassword = await hashPassword(password);

    await this.userRepository.update(userId, {
      forgotPasswordToken: '',
      password: hashedPassword
    });

    return {
      message: 'Password reset successfully'
    };
  }

  async changePassword({
    userId,
    password
  }: IChangePasswordRequestBody & { userId: string }): Promise<IChangePasswordResponse> {
    const hashedPassword = await hashPassword(password);

    await this.userRepository.findOneAndUpdate(
      userId,
      {
        password: hashedPassword
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          emailVerificationToken: 0,
          forgotPasswordToken: 0
        }
      }
    );

    return {
      message: 'Password changed successfully'
    };
  }
}

export default AuthService;
