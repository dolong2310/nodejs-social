import { envConfig } from '@/config';
import { CACHE_KEYS } from '@/constants/cache.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { IRedisService } from '@/database/redis/redis.service';
import {
  ChangePasswordRequestDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO
} from '@/dtos/requests/auth.request.dto';
import {
  AuthTokenPair,
  ChangePasswordResponseDTO,
  ForgotPasswordResponseDTO,
  LogoutResponseDTO,
  RegisterResponseDTO,
  ResendVerifyEmailResponseDTO,
  ResetPasswordResponseDTO,
  VerifyEmailResponseDTO
} from '@/dtos/responses/auth.response.dto';
import { ETokenType } from '@/enums/token.enum';
import { EUserVerificationStatus } from '@/enums/users.enum';
import { IRefreshToken } from '@/models/refreshToken.schema';
import { IUser } from '@/models/user.schema';
import { IEmailJobQueue } from '@/queue/queues/email.queue';
import { IUserRepository } from '@/repositories/user.repository';
import { BadRequestError } from '@/responses/error.response';
import { BaseService } from '@/services/base.service';
import { ITokenService } from '@/services/token.service';
import { EEmailTemplate } from '@/types/mail.type';
import { comparePassword, hashPassword } from '@/utils/password.util';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export interface IAuthService {
  register(body: RegisterRequestDTO, options: { autoLogin: true }): Promise<AuthTokenPair>;
  register(body: RegisterRequestDTO, options?: { autoLogin?: false }): Promise<RegisterResponseDTO>;
  register(body: RegisterRequestDTO, options?: { autoLogin?: boolean }): Promise<RegisterResponseDTO | AuthTokenPair>;
  login(body: LoginRequestDTO, user: IUser): Promise<AuthTokenPair>;
  logout(refreshToken: LogoutRequestDTO): Promise<LogoutResponseDTO>;
  refreshToken(payload: RefreshTokenRequestDTO & { userId: string; exp: number }): Promise<AuthTokenPair>;
  verifyEmail(userId: string): Promise<VerifyEmailResponseDTO>;
  resendVerifyEmail(payload: { userId: string; name: string; email: string }): Promise<ResendVerifyEmailResponseDTO>;
  forgotPassword(
    payload: ForgotPasswordRequestDTO & { userId: string; name: string }
  ): Promise<ForgotPasswordResponseDTO>;
  resetPassword(payload: ResetPasswordRequestDTO & { userId: string }): Promise<ResetPasswordResponseDTO>;
  changePassword(payload: ChangePasswordRequestDTO & { userId: string }): Promise<ChangePasswordResponseDTO>;
  createAuthSession(user: IUser): Promise<AuthTokenPair>;
  findRefreshTokenByToken(token: string): Promise<IRefreshToken | null>;
}

class AuthService extends BaseService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly emailJobQueue: IEmailJobQueue,
    private readonly redisService: IRedisService
  ) {
    super();
  }

  async register(body: RegisterRequestDTO, options: { autoLogin: true }): Promise<AuthTokenPair>;
  async register(body: RegisterRequestDTO, options?: { autoLogin?: false }): Promise<RegisterResponseDTO>;
  async register(
    body: RegisterRequestDTO,
    options?: { autoLogin?: boolean }
  ): Promise<RegisterResponseDTO | AuthTokenPair> {
    const { name, email, password, dateOfBirth } = body;
    const { autoLogin = false } = options ?? {};

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.EMAIL_ALREADY_EXISTS);
    }

    const userId = new ObjectId();

    const emailVerificationToken = await this.tokenService.signEmailVerificationToken({
      userId: userId.toString(),
      type: ETokenType.EMAIL_VERIFICATION_TOKEN
    });

    // TIPS: khi gửi email mà không muốn tạo email mới thì chỉ cần thêm +1 vào cuối của email đó (ví dụ: test123@gmail.com -> test123+1@gmail.com)
    await this.emailJobQueue.add({
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

    const hashedPassword = await hashPassword(password);
    const newUser = await this.userRepository.create({
      userId: userId.toString(),
      name,
      email,
      password: hashedPassword,
      dateOfBirth,
      username: `user-${uuidv4()}`,
      emailVerificationToken,
      verificationStatus: EUserVerificationStatus.UNVERIFIED
    });

    if (autoLogin) {
      return this.createAuthSession(newUser);
    }

    return new RegisterResponseDTO(newUser);
  }

  async login({ password }: LoginRequestDTO, user: IUser): Promise<AuthTokenPair> {
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
    }

    return this.createAuthSession(user);
  }

  async logout({ refreshToken }: LogoutRequestDTO): Promise<LogoutResponseDTO> {
    await this.userRepository.deleteRefreshToken(refreshToken);
    return { message: 'Logout successfully' };
  }

  async refreshToken({
    userId,
    refreshToken,
    exp
  }: RefreshTokenRequestDTO & { userId: string; exp: number }): Promise<AuthTokenPair> {
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

  async verifyEmail(userId: string): Promise<VerifyEmailResponseDTO> {
    await this.userRepository.update(userId, {
      emailVerificationToken: '',
      verificationStatus: EUserVerificationStatus.VERIFIED
    });
    await this.redisService.del(CACHE_KEYS.user(userId));
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
  }): Promise<ResendVerifyEmailResponseDTO> {
    const emailVerificationToken = await this.tokenService.signEmailVerificationToken({
      userId: userId.toString(),
      type: ETokenType.EMAIL_VERIFICATION_TOKEN
    });

    await this.emailJobQueue.add({
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
  }: ForgotPasswordRequestDTO & {
    userId: string;
    name: string;
  }): Promise<ForgotPasswordResponseDTO> {
    const forgotPasswordToken = await this.tokenService.signForgotPasswordToken({
      userId,
      type: ETokenType.FORGOT_PASSWORD_TOKEN
    });

    await this.emailJobQueue.add({
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
  }: ResetPasswordRequestDTO & { userId: string }): Promise<ResetPasswordResponseDTO> {
    const hashedPassword = await hashPassword(password);

    await this.userRepository.update(userId, {
      forgotPasswordToken: '',
      password: hashedPassword
    });
    await this.redisService.del(CACHE_KEYS.user(userId));

    return { message: 'Password reset successfully' };
  }

  async changePassword({
    userId,
    password
  }: ChangePasswordRequestDTO & { userId: string }): Promise<ChangePasswordResponseDTO> {
    const hashedPassword = await hashPassword(password);

    await this.userRepository.findOneAndUpdate(
      userId,
      { password: hashedPassword },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          emailVerificationToken: 0,
          forgotPasswordToken: 0
        }
      }
    );
    await this.redisService.del(CACHE_KEYS.user(userId));

    return { message: 'Password changed successfully' };
  }

  async createAuthSession(user: IUser): Promise<AuthTokenPair> {
    const userId = user._id.toString();

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

    await this.userRepository.createRefreshToken(refreshToken, userId);

    return {
      accessToken,
      refreshToken
    };
  }

  findRefreshTokenByToken(token: string): Promise<IRefreshToken | null> {
    return this.userRepository.findRefreshToken(token);
  }
}

export default AuthService;
