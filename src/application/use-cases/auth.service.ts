import { EEmailTemplate } from '@/domain/enums/mail.enum';
import { ETokenType } from '@/domain/enums/token.enum';
import { EUserVerificationStatus } from '@/domain/enums/users.enum';
import { IUserRepository } from '@/domain/repositories/user/user.repository';

import { CACHE_KEYS } from '@/application/common/constants/cache.constant';
import { comparePassword, hashPassword } from '@/application/common/utils/password.util';
import {
  ChangePasswordPayloadDTO,
  CreateAuthSessionPayloadDTO,
  ForgotPasswordPayloadDTO,
  LoginPayloadDTO,
  LogoutPayloadDTO,
  RefreshTokenPayloadDTO,
  RegisterPayloadDTO,
  ResendVerifyEmailPayloadDTO,
  ResetPasswordPayloadDTO,
  VerifyEmailPayloadDTO
} from '@/application/dtos/auth/auth.payload.dto';
import {
  AuthTokenPairResultDTO,
  ChangePasswordResultDTO,
  ForgotPasswordResultDTO,
  LogoutResultDTO,
  RegisterResultDTO,
  ResendVerifyEmailResultDTO,
  ResetPasswordResultDTO,
  VerifyEmailResultDTO
} from '@/application/dtos/auth/auth.result.dto';
import {
  EmailAlreadyExistsException,
  InvalidEmailOrPasswordException,
  InvalidTokenAuthFailureException,
  InvalidTokenBadRequestException,
  UserAlreadyVerifiedException,
  UserNotFoundException
} from '@/application/errors/auth.error';
import { IAuthService } from '@/application/ports/auth.port';
import { IEmailQueue } from '@/application/ports/email-job.port';
import { IRedisService } from '@/application/ports/redis.port';
import { ITokenService } from '@/application/ports/token.port';
import { BaseService } from '@/application/use-cases/base.service';

import { envConfig } from '@/bootstrap/config/env.config';

import { ObjectId } from 'mongodb'; // TODO: application shouldn not depend on infrastructure
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '@/domain/entities/user.entity';
import { IRefreshTokenRepository } from '@/domain/repositories/refresh-token/refresh-token.repository';

export class AuthService extends BaseService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
    private readonly emailJobQueue: IEmailQueue,
    private readonly redisService: IRedisService
  ) {
    super();
  }

  async register(body: RegisterPayloadDTO, options: { autoLogin: true }): Promise<AuthTokenPairResultDTO>;
  async register(body: RegisterPayloadDTO, options?: { autoLogin?: false }): Promise<RegisterResultDTO>;
  async register(
    body: RegisterPayloadDTO,
    options?: { autoLogin?: boolean }
  ): Promise<RegisterResultDTO | AuthTokenPairResultDTO> {
    const { name, email, password, dateOfBirth } = body;
    const { autoLogin = false } = options ?? {};

    const existingUser = await this.userRepository.findUserByEmail({ email });
    if (existingUser) {
      throw EmailAlreadyExistsException;
    }

    const userId = new ObjectId().toString(); // TODO: application shouldn not depend on infrastructure

    const emailVerificationToken = await this.tokenService.signEmailVerificationToken({
      userId,
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

    const user = await this.userRepository.createUser(
      UserEntity.create({
        id: userId,
        name,
        email,
        password: hashedPassword,
        dateOfBirth: new Date(dateOfBirth),
        username: `user-${uuidv4()}`,
        emailVerificationToken,
        verificationStatus: EUserVerificationStatus.UNVERIFIED
      })
    );

    if (autoLogin) {
      return this.createAuthSession({ userId: user.id });
    }

    return new RegisterResultDTO(user);
  }

  async login({ email, password }: LoginPayloadDTO): Promise<AuthTokenPairResultDTO> {
    const existingUser = await this.userRepository.findUserByEmail({ email });

    if (!existingUser) {
      throw InvalidEmailOrPasswordException;
    }

    const isPasswordValid = await comparePassword(password, existingUser.password);
    if (!isPasswordValid) {
      throw InvalidEmailOrPasswordException;
    }

    return this.createAuthSession({ userId: existingUser.id });
  }

  async logout({ type, refreshToken }: LogoutPayloadDTO): Promise<LogoutResultDTO> {
    if (type !== ETokenType.REFRESH_TOKEN) {
      throw InvalidTokenAuthFailureException;
    }

    const deleted = await this.refreshTokenRepository.deleteRefreshToken({ token: refreshToken });

    if (!deleted) {
      throw InvalidTokenAuthFailureException;
    }

    return new LogoutResultDTO('Logout successfully');
  }

  async refreshToken({ userId, refreshToken, exp, type }: RefreshTokenPayloadDTO): Promise<AuthTokenPairResultDTO> {
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

    const rotated = await this.refreshTokenRepository.rotateRefreshToken({
      oldToken: refreshToken,
      newToken: newRefreshToken,
      userId
    });
    if (!rotated) {
      throw InvalidTokenAuthFailureException;
    }

    return new AuthTokenPairResultDTO({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  }

  async verifyEmail({ userId, token }: VerifyEmailPayloadDTO): Promise<VerifyEmailResultDTO> {
    const user = await this.userRepository.findUserById({ id: userId });

    if (!user) {
      throw UserNotFoundException;
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw UserAlreadyVerifiedException;
    }

    if (user.emailVerificationToken !== token) {
      throw InvalidTokenBadRequestException;
    }

    await this.userRepository.updateEmailVerification({ id: userId });
    await this.redisService.del(CACHE_KEYS.user(userId));

    return new VerifyEmailResultDTO('Email verified successfully');
  }

  async resendVerifyEmail({ userId }: ResendVerifyEmailPayloadDTO): Promise<ResendVerifyEmailResultDTO> {
    const user = await this.userRepository.findUserById({ id: userId });

    if (!user) {
      throw UserNotFoundException;
    }

    if (user.verificationStatus === EUserVerificationStatus.VERIFIED) {
      throw UserAlreadyVerifiedException;
    }

    const emailVerificationToken = await this.tokenService.signEmailVerificationToken({
      userId,
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

    await this.userRepository.updateEmailVerificationToken({ id: userId, emailVerificationToken });
    await this.redisService.del(CACHE_KEYS.user(userId));

    return new ResendVerifyEmailResultDTO('Email verification sent successfully');
  }

  async forgotPassword({ email }: ForgotPasswordPayloadDTO): Promise<ForgotPasswordResultDTO> {
    const existingUser = await this.userRepository.findUserByEmailIncludeNameEmail({ email });

    if (!existingUser) {
      throw InvalidEmailOrPasswordException;
    }

    const userId = existingUser.id;

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

    await this.userRepository.updateForgotPasswordToken({ id: userId, forgotPasswordToken });
    await this.redisService.del(CACHE_KEYS.user(userId));

    return new ForgotPasswordResultDTO('Forgot password sent successfully');
  }

  async resetPassword({ token, userId, password }: ResetPasswordPayloadDTO): Promise<ResetPasswordResultDTO> {
    const user = await this.userRepository.findUserById({ id: userId });

    if (!user) {
      throw UserNotFoundException;
    }

    if (user.forgotPasswordToken !== token) {
      throw InvalidTokenBadRequestException;
    }

    const hashedPassword = await hashPassword(password);

    await this.userRepository.resetPassword({ id: userId, password: hashedPassword });
    await this.redisService.del(CACHE_KEYS.user(userId));

    return new ResetPasswordResultDTO('Password reset successfully');
  }

  async changePassword({ userId, password }: ChangePasswordPayloadDTO): Promise<ChangePasswordResultDTO> {
    const hashedPassword = await hashPassword(password);

    await this.userRepository.changePassword({ id: userId, password: hashedPassword });
    await this.redisService.del(CACHE_KEYS.user(userId));

    return new ChangePasswordResultDTO('Password changed successfully');
  }

  async createAuthSession({ userId }: CreateAuthSessionPayloadDTO): Promise<AuthTokenPairResultDTO> {
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

    await this.refreshTokenRepository.createRefreshToken({ userId, token: refreshToken });

    return new AuthTokenPairResultDTO({ accessToken, refreshToken });
  }
}
