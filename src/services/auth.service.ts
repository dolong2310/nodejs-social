import { envConfig } from '@/config';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ETokenType } from '@/enums/token.enum';
import { EUserVerificationStatus } from '@/enums/users.enum';
import { ILoginRequestBody, IRegisterRequestBody } from '@/models/requests/auth.request';
import { IRefreshToken } from '@/models/schemas/refreshToken.schema';
import { IUser } from '@/models/schemas/user.schema';
import { IUserRepository } from '@/repositories/user.repository';
import { BadRequestError, NotFoundError } from '@/responses/error.response';
import { EEmailTemplate, IEmailService } from '@/services/email.service';
import { ITokenService } from '@/services/token.service';
import { comparePassword, hashPassword } from '@/utils/helper.util';
import { omit } from 'lodash-es';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export interface IAuthService {
  findRefreshTokenByToken(token: string): Promise<IRefreshToken | null>;
  // Nếu autoLogin là true, trả về accessToken và refreshToken.
  register(
    body: Omit<IRegisterRequestBody, 'confirmPassword'>,
    options: { autoLogin: true }
  ): Promise<{ accessToken: string; refreshToken: string }>;
  // Nếu autoLogin là false hoặc không truyền options, trả về thông tin user
  register(
    body: Omit<IRegisterRequestBody, 'confirmPassword'>,
    options?: { autoLogin?: false }
  ): Promise<Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'>>;
  // Overload Functions
  register(
    body: Omit<IRegisterRequestBody, 'confirmPassword'>,
    options?: {
      autoLogin?: boolean;
    }
  ): Promise<
    | Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'>
    | { accessToken: string; refreshToken: string }
  >;
  login(body: ILoginRequestBody, user: IUser): Promise<{ accessToken: string; refreshToken: string }>;
  logout(refreshToken: string): Promise<void>;
  refreshToken(payload: {
    userId: string;
    refreshTokenBody: string;
    exp: number;
  }): Promise<{ accessToken: string; refreshToken: string }>;
  verifyEmail(userId: string): Promise<void>;
  resendVerifyEmail(payload: { userId: string; name: string; email: string }): Promise<void>;
  forgotPassword(payload: { userId: string; name: string; email: string }): Promise<void>;
  resetPassword(payload: { userId: string; password: string }): Promise<void>;
  changePassword(payload: {
    userId: string;
    newPassword: string;
  }): Promise<Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'> | null>;
}

class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly emailService: IEmailService
  ) {}

  findRefreshTokenByToken(token: string): Promise<IRefreshToken | null> {
    return this.userRepository.findRefreshToken(token);
  }

  // Nếu autoLogin là true, trả về accessToken và refreshToken.
  async register(
    body: Omit<IRegisterRequestBody, 'confirmPassword'>,
    options: { autoLogin: true }
  ): Promise<{ accessToken: string; refreshToken: string }>;
  // Nếu autoLogin là false hoặc không truyền options, trả về thông tin user
  async register(
    body: Omit<IRegisterRequestBody, 'confirmPassword'>,
    options?: { autoLogin?: false }
  ): Promise<Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'>>;
  // Overload Functions
  async register(
    body: Omit<IRegisterRequestBody, 'confirmPassword'>,
    options?: {
      autoLogin?: boolean;
    }
  ): Promise<
    | Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'>
    | { accessToken: string; refreshToken: string }
  > {
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

    return omit(newUser, ['password', 'emailVerificationToken', 'forgotPasswordToken']);
  }

  async login(body: ILoginRequestBody, user: IUser): Promise<{ accessToken: string; refreshToken: string }> {
    const { password } = body;

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

  async logout(refreshToken: string): Promise<void> {
    await this.userRepository.deleteRefreshToken(refreshToken);
  }

  async refreshToken({
    userId,
    refreshTokenBody,
    exp
  }: {
    userId: string;
    refreshTokenBody: string;
    exp: number;
  }): Promise<{ accessToken: string; refreshToken: string }> {
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
      this.userRepository.deleteRefreshToken(refreshTokenBody),
      this.userRepository.createRefreshToken(newRefreshToken, userId)
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      emailVerificationToken: '',
      verificationStatus: EUserVerificationStatus.VERIFIED
    });
  }

  async resendVerifyEmail({ userId, name, email }: { userId: string; name: string; email: string }): Promise<void> {
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
  }

  async forgotPassword({ userId, name, email }: { userId: string; name: string; email: string }): Promise<void> {
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
  }

  async resetPassword({ userId, password }: { userId: string; password: string }): Promise<void> {
    const hashedPassword = await hashPassword(password);

    await this.userRepository.update(userId, {
      forgotPasswordToken: '',
      password: hashedPassword
    });
  }

  async changePassword({
    userId,
    newPassword
  }: {
    userId: string;
    newPassword: string;
  }): Promise<Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'> | null> {
    const hashedPassword = await hashPassword(newPassword);

    return this.userRepository.findOneAndUpdate(
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
  }
}

export default AuthService;
