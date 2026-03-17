import { envConfig } from '@/constants/config.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ETokenType } from '@/enums/token.enum';
import { EUserVerificationStatus } from '@/enums/users.enum';
import { BadRequestError, NotFoundError } from '@/models/error.response';
import { ILoginRequestBody, IRegisterRequestBody } from '@/models/requests/auth.request';
import RefreshTokenSchema, { IRefreshToken } from '@/models/schemas/refreshToken.schema';
import UserSchema, { IUser } from '@/models/schemas/user.schema';
import databaseService from '@/services/database.service';
import emailService, { EEmailTemplate } from '@/services/email.service';
import tokenService from '@/services/token.service';
import usersService from '@/services/users.service';
import { comparePassword, hashPassword } from '@/utils/helper.util';
import { omit } from 'lodash-es';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

class AuthService {
  constructor() {}

  findRefreshTokenByToken(token: string): Promise<IRefreshToken | null> {
    return databaseService.refreshTokens.findOne<IRefreshToken>({ token });
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
    const emailVerificationToken = await tokenService.signEmailVerificationToken({
      userId: userId.toString(),
      type: ETokenType.EMAIL_VERIFICATION_TOKEN
    });

    // gửi email xác thực
    // TIPS: khi gửi email mà không muốn tạo email mới thì chỉ cần thêm +1 vào cuối của email đó (ví dụ: test123@gmail.com -> test123+1@gmail.com)
    await emailService.sendEmail({
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

    const user = await usersService.findUserByEmail(email);
    if (user) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await hashPassword(password);
    const newUser = new UserSchema({
      _id: userId,
      name,
      email,
      password: hashedPassword,
      dateOfBirth: new Date(dateOfBirth),
      username: `user-${uuidv4()}`,
      emailVerificationToken,
      verificationStatus: EUserVerificationStatus.UNVERIFIED
    });
    await databaseService.users.insertOne(newUser);

    if (autoLogin) {
      return this.login({ email, password }, newUser);
    }

    return omit(newUser, ['password', 'emailVerificationToken', 'forgotPasswordToken']);
  }

  async login(body: ILoginRequestBody, user?: IUser): Promise<{ accessToken: string; refreshToken: string }> {
    const { password } = body;

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
    }

    // Tạo cặp token JWT
    const [accessToken, refreshToken] = await Promise.all([
      tokenService.signAccessToken({
        userId: user._id!.toString(),
        type: ETokenType.ACCESS_TOKEN
      }),
      tokenService.signRefreshToken({
        userId: user._id!.toString(),
        type: ETokenType.REFRESH_TOKEN
      })
    ]);

    // Lưu token vào database
    await databaseService.refreshTokens.insertOne(
      new RefreshTokenSchema({
        token: refreshToken,
        userId: new ObjectId(user._id)
      })
    );

    return {
      accessToken,
      refreshToken
    };
  }

  async logout(refreshToken: string): Promise<void> {
    // delete refresh token from database
    await databaseService.refreshTokens.deleteOne({
      token: refreshToken
    });
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
      tokenService.signAccessToken({
        userId,
        type: ETokenType.ACCESS_TOKEN
      }),
      tokenService.signRefreshToken({
        userId,
        type: ETokenType.REFRESH_TOKEN,
        exp
      })
    ]);

    await Promise.all([
      databaseService.refreshTokens.deleteOne({
        token: refreshTokenBody
      }),
      databaseService.refreshTokens.insertOne(
        new RefreshTokenSchema({
          token: newRefreshToken,
          userId: new ObjectId(userId)
        })
      )
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async verifyEmail(userId: string): Promise<void> {
    // cập nhật user
    await databaseService.users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          emailVerificationToken: '',
          verificationStatus: EUserVerificationStatus.VERIFIED
          // updatedAt: new Date() // giá trị được cập nhật tại thời điểm update trong service
        },
        $currentDate: { updatedAt: true } // giá trị được cập nhật tại thời điểm mongodb update document (chênh lệch với service vì nó chạy sau)
      }
    );
  }

  async resendVerifyEmail({ userId, name, email }: { userId: string; name: string; email: string }) {
    const emailVerificationToken = await tokenService.signEmailVerificationToken({
      userId: userId.toString(),
      type: ETokenType.EMAIL_VERIFICATION_TOKEN
    });

    // gửi email xác thực
    await emailService.sendEmail({
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

    await databaseService.users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { emailVerificationToken }, $currentDate: { updatedAt: true } }
    );
  }

  async forgotPassword({ userId, name, email }: { userId: string; name: string; email: string }) {
    const forgotPasswordToken = await tokenService.signForgotPasswordToken({
      userId,
      type: ETokenType.FORGOT_PASSWORD_TOKEN
    });

    // gửi email xác thực
    await emailService.sendEmail({
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

    await databaseService.users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { forgotPasswordToken }, $currentDate: { updatedAt: true } }
    );
  }

  async resetPassword({ userId, password }: { userId: string; password: string }) {
    const hashedPassword = await hashPassword(password);

    await databaseService.users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { forgotPasswordToken: '', password: hashedPassword }, $currentDate: { updatedAt: true } }
    );
  }

  async changePassword({ userId, newPassword }: { userId: string; newPassword: string }) {
    const hashedPassword = await hashPassword(newPassword);

    return databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword
        },
        $currentDate: {
          updatedAt: true
        }
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

export default new AuthService();
