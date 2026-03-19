/*
 * User Repository
 * This file contains the UserRepository class which implements IUserRepository interface.
 * It provides methods to interact with the user data in the database.
 */

import { EUserVerificationStatus } from '@/enums/users.enum';
import { IRegisterRequestBody } from '@/models/requests/auth.request';
import RefreshTokenSchema, { IRefreshToken } from '@/models/schemas/refreshToken.schema';
import UserSchema, { IUser } from '@/models/schemas/user.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { FindOneAndUpdateOptions, FindOneOptions, ObjectId, UpdateResult, WithId } from 'mongodb';

export interface IUserRepository {
  findRefreshToken(token: string): Promise<IRefreshToken | null>;
  createRefreshToken(token: string, userId: string): Promise<IRefreshToken>;
  deleteRefreshToken(token: string): Promise<boolean>;
  create(
    data: IRegisterRequestBody & {
      userId: string;
      emailVerificationToken: string;
      verificationStatus: EUserVerificationStatus;
      username: string;
    }
  ): Promise<IUser>;
  update(id: string, data: Partial<IUser>): Promise<UpdateResult<IUser>>;
  findOneAndUpdate<T = IUser>(id: string, data: Partial<IUser>, options?: FindOneAndUpdateOptions): Promise<T | null>;
  findById<T = IUser>(id: string, options?: FindOneOptions): Promise<T | null>;
  findByEmail<T = IUser>(email: string, options?: FindOneOptions): Promise<T | null>;
  findByUsername<T = IUser>(username: string, options?: FindOneOptions): Promise<T | null>;
}

export class UserRepository extends BaseRepository implements IUserRepository {
  findRefreshToken(token: string): Promise<IRefreshToken | null> {
    return this.db.refreshTokens.findOne<IRefreshToken>({ token });
  }

  async createRefreshToken(token: string, userId: string): Promise<IRefreshToken> {
    const newRefreshToken = new RefreshTokenSchema({
      token,
      userId: new ObjectId(userId)
    });
    await this.db.refreshTokens.insertOne(newRefreshToken);
    return newRefreshToken;
  }

  async deleteRefreshToken(token: string): Promise<boolean> {
    const result = await this.db.refreshTokens.deleteOne({ token });
    return result.deletedCount > 0;
  }

  async create(
    data: IRegisterRequestBody & {
      userId: string;
      emailVerificationToken: string;
      verificationStatus: EUserVerificationStatus;
      username: string;
    }
  ): Promise<IUser> {
    const newUser = new UserSchema({
      _id: new ObjectId(data.userId),
      name: data.name,
      email: data.email,
      password: data.password,
      dateOfBirth: new Date(data.dateOfBirth),
      username: data.username,
      emailVerificationToken: data.emailVerificationToken,
      verificationStatus: data.verificationStatus
    });
    await this.db.users.insertOne(newUser);
    return newUser;
  }

  async update(id: string, data: Partial<IUser>): Promise<UpdateResult<IUser>> {
    const result = await this.db.users.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          emailVerificationToken: data.emailVerificationToken,
          verificationStatus: data.verificationStatus
        },
        $currentDate: { updatedAt: true } // giá trị được cập nhật tại thời điểm mongodb update document (chênh lệch với service vì nó chạy sau)
      }
    );
    return result;
  }

  async findOneAndUpdate<T = WithId<IUser>>(
    id: string,
    data: Partial<IUser>,
    options?: FindOneAndUpdateOptions
  ): Promise<T | null> {
    const result = await this.db.users.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: data,
        $currentDate: {
          updatedAt: true
        }
      },
      options ?? {}
    );
    return result as T;
  }

  findById<T = IUser>(id: string, options?: FindOneOptions): Promise<T | null> {
    return this.db.users.findOne<T>({ _id: new ObjectId(id) }, options ?? {});
  }

  findByEmail<T = IUser>(email: string, options?: FindOneOptions): Promise<T | null> {
    return this.db.users.findOne<T>({ email }, options ?? {});
  }

  findByUsername<T = IUser>(username: string, options?: FindOneOptions): Promise<T | null> {
    return this.db.users.findOne<T>({ username }, options ?? {});
  }
}
