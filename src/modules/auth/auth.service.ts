import { envConfig } from '@/config/envConfig';
import { CACHE_KEYS } from '@/constants/cache.constant';
import { Injectable } from '@/decorators/injectable.decorator';
import { ETokenType } from '@/interfaces/enums/token.enum';
import { EEmailTemplate } from '@/interfaces/types/mail.type';
import {
  EmailAlreadyExistsException,
  InvalidEmailOrPasswordException,
  InvalidTokenAuthFailureException,
  InvalidTokenBadRequestException,
  UserAlreadyVerifiedException,
  UserNotFoundException
} from '@/modules/auth/auth.exception';
import {
  ChangePasswordRequestDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO
} from '@/modules/auth/dtos/auth.request.dto';
import {
  AuthTokenPair,
  ChangePasswordResponseDTO,
  ForgotPasswordResponseDTO,
  LogoutResponseDTO,
  RegisterResponseDTO,
  ResendVerifyEmailResponseDTO,
  ResetPasswordResponseDTO,
  VerifyEmailResponseDTO
} from '@/modules/auth/dtos/auth.response.dto';
import { BaseService } from '@/modules/base/base.service';
import { EUserVerificationStatus } from '@/modules/users/users.enum';
import { UserRepository } from '@/modules/users/users.repository';
import { IUser } from '@/modules/users/users.schema';
import { RedisService } from '@/providers/database/redis/redis.service';
import { EmailJobQueue } from '@/providers/queue/queues/email.queue';
import { IRefreshToken } from '@/modules/auth/refreshToken.schema';
import { TokenService } from '@/shared/services/token.service';
import { comparePassword, hashPassword } from '@/utils/password.util';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export interface IAuthService {
  register(body: RegisterRequestDTO, options: { autoLogin: true }): Promise<AuthTokenPair>;
  register(body: RegisterRequestDTO, options?: { autoLogin?: false }): Promise<RegisterResponseDTO>;
  register(body: RegisterRequestDTO, options?: { autoLogin?: boolean }): Promise<RegisterResponseDTO | AuthTokenPair>;
  login(body: LoginRequestDTO): Promise<AuthTokenPair>;
  logout(body: LogoutRequestDTO & { type: ETokenType }): Promise<LogoutResponseDTO>;
  refreshToken(
    body: RefreshTokenRequestDTO & { userId: string; exp: number; type: ETokenType }
  ): Promise<AuthTokenPair>;
  verifyEmail({ userId, token }: { userId: string; token: string }): Promise<VerifyEmailResponseDTO>;
  resendVerifyEmail(userId: string): Promise<ResendVerifyEmailResponseDTO>;
  forgotPassword(payload: ForgotPasswordRequestDTO): Promise<ForgotPasswordResponseDTO>;
  resetPassword(payload: ResetPasswordRequestDTO & { userId: string }): Promise<ResetPasswordResponseDTO>;
  changePassword(payload: ChangePasswordRequestDTO & { userId: string }): Promise<ChangePasswordResponseDTO>;
  createAuthSession(user: IUser): Promise<AuthTokenPair>;
  findRefreshTokenByToken(token: string): Promise<IRefreshToken | null>;
}

@Injectable()
export class AuthService extends BaseService implements IAuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly emailJobQueue: EmailJobQueue,
    private readonly redisService: RedisService
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
      throw EmailAlreadyExistsException;
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
    const newUser = await this.userRepository.createUser({
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

  async login({ email, password }: LoginRequestDTO): Promise<AuthTokenPair> {
    const existingUser = await this.userRepository.findByEmail(email);

    if (!existingUser) {
      throw InvalidEmailOrPasswordException;
    }

    const isPasswordValid = await comparePassword(password, existingUser.password);
    if (!isPasswordValid) {
      throw InvalidEmailOrPasswordException;
    }

    return this.createAuthSession(existingUser);
  }

  async logout({ type, refreshToken }: LogoutRequestDTO & { type: ETokenType }): Promise<LogoutResponseDTO> {
    if (type !== ETokenType.REFRESH_TOKEN) {
      throw InvalidTokenAuthFailureException;
    }

    const deleted = await this.userRepository.deleteRefreshToken(refreshToken);
    if (!deleted) {
      throw InvalidTokenAuthFailureException;
    }
    return { message: 'Logout successfully' };
  }

  async refreshToken({
    userId,
    refreshToken,
    exp,
    type
  }: RefreshTokenRequestDTO & { userId: string; exp: number; type: ETokenType }): Promise<AuthTokenPair> {
    if (type !== ETokenType.REFRESH_TOKEN) {
      throw InvalidTokenAuthFailureException;
    }

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

    const rotated = await this.userRepository.rotateRefreshToken(refreshToken, newRefreshToken, userId);
    if (!rotated) {
      throw InvalidTokenAuthFailureException;
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async verifyEmail({ userId, token }: { userId: string; token: string }): Promise<VerifyEmailResponseDTO> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw UserNotFoundException;
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw UserAlreadyVerifiedException;
    }

    if (user.emailVerificationToken !== token) {
      throw InvalidTokenBadRequestException;
    }

    await this.userRepository.markEmailVerified(userId);
    await this.redisService.del(CACHE_KEYS.user(userId));
    return { message: 'Email verified successfully' };
  }

  async resendVerifyEmail(userId: string): Promise<ResendVerifyEmailResponseDTO> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw UserNotFoundException;
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw UserAlreadyVerifiedException;
    }

    const emailVerificationToken = await this.tokenService.signEmailVerificationToken({
      userId: userId.toString(),
      type: ETokenType.EMAIL_VERIFICATION_TOKEN
    });

    await this.emailJobQueue.add({
      toAddress: user.email,
      subject: 'Email Verification',
      body: {
        name: user.name,
        url: `${envConfig.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`,
        expiresIn: '1 hour',
        appName: 'Social Media App',
        supportUrl: 'https://www.google.com'
      },
      template: EEmailTemplate.VERIFY_EMAIL
    });

    await this.userRepository.updateEmailVerificationToken(userId, emailVerificationToken);
    await this.redisService.del(CACHE_KEYS.user(userId));

    return {
      message: 'Email verification sent successfully'
    };
  }

  async forgotPassword({ email }: ForgotPasswordRequestDTO): Promise<ForgotPasswordResponseDTO> {
    const existingUser = await this.userRepository.findByEmailIncludeNameAndEmail(email);

    if (!existingUser) {
      throw InvalidEmailOrPasswordException;
    }

    const userId = existingUser._id.toString();

    const forgotPasswordToken = await this.tokenService.signForgotPasswordToken({
      userId,
      type: ETokenType.FORGOT_PASSWORD_TOKEN
    });

    await this.emailJobQueue.add({
      toAddress: email,
      subject: 'Forgot Password',
      body: {
        name: existingUser.name,
        url: `${envConfig.FRONTEND_URL}/reset-password?token=${forgotPasswordToken}`,
        expiresIn: '1 hour',
        appName: 'Social Media App',
        supportUrl: 'https://www.google.com'
      },
      template: EEmailTemplate.FORGOT_PASSWORD
    });

    await this.userRepository.updateForgotPasswordToken(userId, forgotPasswordToken);
    await this.redisService.del(CACHE_KEYS.user(userId));

    return {
      message: 'Forgot password sent successfully'
    };
  }

  async resetPassword({
    token,
    userId,
    password
  }: ResetPasswordRequestDTO & { userId: string }): Promise<ResetPasswordResponseDTO> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw UserNotFoundException;
    }

    if (user.forgotPasswordToken !== token) {
      throw InvalidTokenBadRequestException;
    }

    const hashedPassword = await hashPassword(password);

    await this.userRepository.resetPassword(userId, hashedPassword);
    await this.redisService.del(CACHE_KEYS.user(userId));

    return { message: 'Password reset successfully' };
  }

  async changePassword({
    userId,
    password
  }: ChangePasswordRequestDTO & { userId: string }): Promise<ChangePasswordResponseDTO> {
    const hashedPassword = await hashPassword(password);

    await this.userRepository.changePassword(userId, { password: hashedPassword });
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
