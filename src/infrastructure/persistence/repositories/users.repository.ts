import { IUser } from '@/domain/entities/user.entity';
import { EUserVerificationStatus } from '@/domain/enums/users.enum';
import {
  IChangePasswordInput,
  ICreateUserInput,
  IFindManyUsersByIdsIncludeNameUsernameAvatarInput,
  IFindManyUsersByIdsInput,
  IFindUserByEmailInput,
  IFindUserByIdInput,
  IFindUserByUsernameInput,
  IResetPasswordInput,
  IUpdateEmailVerificationInput,
  IUpdateEmailVerificationTokenInput,
  IUpdateForgotPasswordTokenInput,
  IUpdateMeInput
} from '@/domain/repositories/user/user.interface';
import { IUserRepository } from '@/domain/repositories/user/user.repository';

import { UserMapper } from '@/infrastructure/persistence/mapper/user.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';

import { ObjectId } from 'mongodb';

export class UserRepository extends BaseRepository implements IUserRepository {
  constructor(
    readonly db: DatabaseService,
    private readonly userMapper: UserMapper
  ) {
    super(db);
  }

  async createUser(data: ICreateUserInput): Promise<IUser> {
    // mapper to persistence layer
    const user = this.userMapper.toPersistence(data);
    await this.db.users.insertOne(user);

    // mapper to domain layer
    return this.userMapper.toDomain(user);
  }

  async updateMe(data: IUpdateMeInput): Promise<IUser | null> {
    const user = this.userMapper.toPersistence(data);
    const result = await this.db.users.findOneAndUpdate(
      { _id: user._id },
      {
        $set: data,
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
    return result ? this.userMapper.toDomain(result) : null;
  }

  async updateEmailVerification(data: IUpdateEmailVerificationInput): Promise<boolean> {
    const user = this.userMapper.toPersistence(data);
    const result = await this.db.users.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationToken: '',
          verificationStatus: EUserVerificationStatus.VERIFIED
        },
        $currentDate: { updatedAt: true } // giá trị được cập nhật tại thời điểm mongodb update document (chênh lệch với service vì nó chạy sau)
      }
    );
    return result.modifiedCount > 0;
  }

  async updateEmailVerificationToken(data: IUpdateEmailVerificationTokenInput): Promise<boolean> {
    const user = this.userMapper.toPersistence(data);
    const result = await this.db.users.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationToken: user.emailVerificationToken
        },
        $currentDate: { updatedAt: true }
      }
    );
    return result.modifiedCount > 0;
  }

  async updateForgotPasswordToken(data: IUpdateForgotPasswordTokenInput): Promise<boolean> {
    const user = this.userMapper.toPersistence(data);
    const result = await this.db.users.updateOne(
      { _id: user._id },
      {
        $set: {
          forgotPasswordToken: user.forgotPasswordToken
        },
        $currentDate: { updatedAt: true }
      }
    );
    return result.modifiedCount > 0;
  }

  async resetPassword(data: IResetPasswordInput): Promise<boolean> {
    const user = this.userMapper.toPersistence(data);
    const result = await this.db.users.updateOne(
      { _id: user._id },
      {
        $set: {
          password: user.password,
          forgotPasswordToken: ''
        },
        $currentDate: { updatedAt: true }
      }
    );
    return result.modifiedCount > 0;
  }

  async changePassword(data: IChangePasswordInput): Promise<IUser | null> {
    const user = this.userMapper.toPersistence(data);
    const result = await this.db.users.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          password: user.password
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
    return result ? this.userMapper.toDomain(result) : null;
  }

  async findUserById(data: IFindUserByIdInput): Promise<IUser | null> {
    const user = this.userMapper.toPersistence(data);
    const result = await this.db.users.findOne({ _id: user._id });
    return result ? this.userMapper.toDomain(result) : null;
  }

  async findUserByEmail(data: IFindUserByEmailInput): Promise<IUser | null> {
    const user = this.userMapper.toPersistence(data);
    const result = await this.db.users.findOne({ email: user.email });
    return result ? this.userMapper.toDomain(result) : null;
  }

  async findUserByEmailIncludeNameEmail(data: IFindUserByEmailInput): Promise<IUser | null> {
    const user = this.userMapper.toPersistence(data);
    const result = await this.db.users.findOne({ email: user.email }, { projection: { name: 1, email: 1 } });
    return result ? this.userMapper.toDomain(result) : null;
  }

  async findUserByUsername(data: IFindUserByUsernameInput): Promise<IUser | null> {
    const user = this.userMapper.toPersistence(data);
    const result = await this.db.users.findOne({ username: user.username });
    return result ? this.userMapper.toDomain(result) : null;
  }

  async findManyUsersByIds(data: IFindManyUsersByIdsInput): Promise<IUser[]> {
    if (data.ids.length === 0) {
      return [];
    }
    const unique = [...new Set(data.ids)].filter((id) => ObjectId.isValid(id));
    if (unique.length === 0) {
      return [];
    }
    const oids = unique.map((id) => new ObjectId(id));
    const users = await this.db.users.find({ _id: { $in: oids } }).toArray();
    const result = users.map((user) => this.userMapper.toDomain(user));
    return result;
  }

  async findManyUsersByIdsIncludeNameUsernameAvatar(
    data: IFindManyUsersByIdsIncludeNameUsernameAvatarInput
  ): Promise<IUser[]> {
    if (data.ids.length === 0) {
      return [];
    }
    const unique = [...new Set(data.ids)].filter((id) => ObjectId.isValid(id));
    if (unique.length === 0) {
      return [];
    }
    const oids = unique.map((id) => new ObjectId(id));
    const users = await this.db.users
      .find(
        { _id: { $in: oids } },
        {
          projection: {
            _id: 1,
            name: 1,
            username: 1,
            avatar: 1
          }
        }
      )
      .toArray();

    const result = users.map((user) => this.userMapper.toDomain(user));
    return result;
  }
}
