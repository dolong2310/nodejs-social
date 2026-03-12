import HTTP_STATUS from '@/constants/httpStatus.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { TokenType } from '@/enums/token.enum';
import { UserVerificationStatus } from '@/enums/users.enum';
import { ErrorWithStatus } from '@/models/error.model';
import { ILoginRequestBody, IRegisterRequestBody, IUpdateMeRequestBody } from '@/models/requests/user.request';
import RefreshTokenSchema, { IRefreshToken } from '@/models/schemas/refreshToken.schema';
import UserSchema, { IUser } from '@/models/schemas/user.schema';
import databaseService from '@/services/database.service';
import tokenService from '@/services/token.service';
import { comparePassword, hashPassword } from '@/utils/helper.util';
import { ObjectId, WithId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

class UsersService {
  constructor() {}

  findUserByEmail(email: string): Promise<IUser | null> {
    return databaseService.users.findOne<IUser>({ email });
  }

  findUserById(userId: string): Promise<IUser | null> {
    return databaseService.users.findOne<IUser>({ _id: new ObjectId(userId) });
  }

  findRefreshTokenByToken(token: string): Promise<IRefreshToken | null> {
    return databaseService.refreshTokens.findOne<IRefreshToken>({ token });
  }

  findUserByUsername(username: string): Promise<IUser | null> {
    return databaseService.users.findOne<IUser>({ username });
  }

  async register(body: Omit<IRegisterRequestBody, 'confirmPassword'>): Promise<IUser> {
    const { name, email, password, dateOfBirth } = body;

    const userId = new ObjectId();

    // tạo email verification token
    const emailVerificationToken = await tokenService.signEmailVerificationToken({
      userId: userId.toString(),
      type: TokenType.EMAIL_VERIFICATION_TOKEN
    });

    // TODO: Gửi email xác thực trước khi tạo user
    // gửi email xác thực
    // await emailService.sendEmailVerificationEmail(email, emailVerificationToken);
    console.log('emailVerificationToken: ', emailVerificationToken);

    const user = await this.findUserByEmail(email);
    if (user) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.EMAIL_ALREADY_EXISTS,
        status: HTTP_STATUS.BAD_REQUEST
      });
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
      verificationStatus: UserVerificationStatus.UNVERIFIED
    });
    await databaseService.users.insertOne(newUser);

    return newUser;
  }

  async login(body: ILoginRequestBody, user?: IUser): Promise<{ accessToken: string; refreshToken: string }> {
    const { password } = body;

    if (!user) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.UNAUTHORIZED
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD,
        status: HTTP_STATUS.UNAUTHORIZED
      });
    }

    // Tạo cặp token JWT
    const [accessToken, refreshToken] = await Promise.all([
      tokenService.signAccessToken({
        userId: user._id!.toString(),
        type: TokenType.ACCESS_TOKEN
      }),
      tokenService.signRefreshToken({
        userId: user._id!.toString(),
        type: TokenType.REFRESH_TOKEN
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
        type: TokenType.ACCESS_TOKEN
      }),
      tokenService.signRefreshToken({
        userId,
        type: TokenType.REFRESH_TOKEN,
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
          verificationStatus: UserVerificationStatus.VERIFIED
          // updatedAt: new Date() // giá trị được cập nhật tại thời điểm update trong service
        },
        $currentDate: { updatedAt: true } // giá trị được cập nhật tại thời điểm mongodb update document (chênh lệch với service vì nó chạy sau)
      }
    );
  }

  async resendVerifyEmail(userId: string) {
    const emailVerificationToken = await tokenService.signEmailVerificationToken({
      userId: userId.toString(),
      type: TokenType.EMAIL_VERIFICATION_TOKEN
    });

    // gửi email xác thực
    // await emailService.sendEmailVerificationEmail(email, emailVerificationToken);
    console.log('resendVerifyEmail token: ', emailVerificationToken);

    await databaseService.users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { emailVerificationToken }, $currentDate: { updatedAt: true } }
    );
  }

  async forgotPassword(userId: string) {
    const forgotPasswordToken = await tokenService.signForgotPasswordToken({
      userId,
      type: TokenType.FORGOT_PASSWORD_TOKEN
    });

    // gửi email xác thực
    // await emailService.sendEmailVerificationEmail(email, forgotPasswordToken);
    console.log('forgotPassword token: ', forgotPasswordToken);

    await databaseService.users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { forgotPasswordToken }, $currentDate: { updatedAt: true } }
    );
  }

  async resetPassword({ userId, newPassword }: { userId: string; newPassword: string }) {
    const hashedPassword = await hashPassword(newPassword);

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

  getMe(
    userId: string
  ): Promise<WithId<Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'>> | null> {
    return databaseService.users.findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          password: 0,
          emailVerificationToken: 0,
          forgotPasswordToken: 0
        }
      }
    );
  }

  updateMe(userId: string, body: IUpdateMeRequestBody & { dateOfBirth?: Date }): Promise<IUser | null> {
    return databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      {
        $set: body,
        $currentDate: { updatedAt: true }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0
          // emailVerificationToken: 0,
          // forgotPasswordToken: 0
        }
      }
    );
  }

  getUserProfile(
    username: string
  ): Promise<WithId<Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'>> | null> {
    return databaseService.users.findOne(
      { name: username },
      {
        projection: {
          password: 0,
          emailVerificationToken: 0,
          forgotPasswordToken: 0
        }
      }
    );
  }
}

export default new UsersService();
