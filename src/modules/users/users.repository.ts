/*
 * User Repository
 * This file contains the UserRepository class which implements IUserRepository interface.
 * It provides methods to interact with the user data in the database.
 */

import { Injectable } from '@/decorators/injectable.decorator';
import { RegisterRequestDTO } from '@/modules/auth/dtos/auth.request.dto';
import { BaseRepository } from '@/modules/base/base.repository';
import { EUserVerificationStatus } from '@/modules/users/users.enum';
import { IUser, UserSchema } from '@/modules/users/users.schema';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { IRefreshToken, RefreshTokenSchema } from '@/shared/models/refreshToken.schema';
import { FindOneAndUpdateOptions, FindOneOptions, ObjectId, UpdateResult } from 'mongodb';

export interface IUserRepository {
  findRefreshToken(token: string): Promise<IRefreshToken | null>;
  createRefreshToken(token: string, userId: string): Promise<IRefreshToken>;
  deleteRefreshToken(token: string): Promise<boolean>;
  create(
    data: RegisterRequestDTO & {
      userId: string;
      emailVerificationToken: string;
      verificationStatus: EUserVerificationStatus;
      username: string;
    }
  ): Promise<IUser>;
  update(id: string, data: Partial<IUser>): Promise<UpdateResult<IUser>>;
  findOneAndUpdate(id: string, data: Partial<IUser>, options?: FindOneAndUpdateOptions): Promise<IUser | null>;
  findById<T = IUser>(id: string, options?: FindOneOptions): Promise<T | null>;
  findByEmail<T = IUser>(email: string, options?: FindOneOptions): Promise<T | null>;
  findByUsername<T = IUser>(username: string, options?: FindOneOptions): Promise<T | null>;
  findManyByIds(ids: string[], projection?: Record<string, 0 | 1>): Promise<IUser[]>;
}

@Injectable()
export class UserRepository extends BaseRepository implements IUserRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

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
    data: RegisterRequestDTO & {
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

  async findOneAndUpdate(id: string, data: Partial<IUser>, options?: FindOneAndUpdateOptions): Promise<IUser | null> {
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
    return result;
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

  async findManyByIds(ids: string[], projection?: Record<string, 0 | 1>): Promise<IUser[]> {
    if (ids.length === 0) {
      return [];
    }
    const unique = [...new Set(ids)].filter((id) => ObjectId.isValid(id));
    if (unique.length === 0) {
      return [];
    }
    const oids = unique.map((id) => new ObjectId(id));
    return this.db.users.find({ _id: { $in: oids } }, projection ? { projection } : undefined).toArray();
  }
}
