import { LoggerPort } from '@/application/ports/logger.port';
import { UserEntity } from '@/domain/entities/user/user.entity';
import { SafeUserEntity, UserRepositoryPort } from '@/domain/repositories/user/user.repository';
import {
  IChangePasswordInput,
  IResetPasswordInput,
  IUpdateMeInput
} from '@/domain/repositories/user/user.repository.type';
import { MongoRepositoryBase } from '@/infrastructure/persistence/repositories/base/base.mongo.repository';
import { UserMapper } from '@/infrastructure/persistence/repositories/user/user.mapper';
import { UserModel } from '@/infrastructure/persistence/repositories/user/user.model';
import { Db, MongoClient } from 'mongodb';

export class UserRepository extends MongoRepositoryBase<UserEntity, UserModel> implements UserRepositoryPort {
  protected collectionName = 'users';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: UserMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async findSafeUserById(id: string): Promise<SafeUserEntity | null> {
    const result = await this.findById(id, {
      projection: { password: 0, totpSecret: 0 }
    });
    return result;
  }

  async findSafeUserByUsername(username: string): Promise<SafeUserEntity | null> {
    const result = await this.findOne({ username } as Partial<UserEntity>, {
      projection: { password: 0, totpSecret: 0 }
    });
    return result;
  }

  async findSafeUserByEmail(email: string): Promise<SafeUserEntity | null> {
    const result = await this.findOne({ email } as Partial<UserEntity>, {
      projection: { password: 0, totpSecret: 0 }
    });
    return result;
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    const result = await this.findById(id);
    return result;
  }

  async findUserByUsername(username: string): Promise<UserEntity | null> {
    const result = await this.findOne({ username } as Partial<UserEntity>);
    return result;
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.findOne({ email } as Partial<UserEntity>);
    return result;
  }

  async findUserByEmailIncludeNameEmail(email: string): Promise<UserEntity | null> {
    const result = await this.findOne({ email } as Partial<UserEntity>, {
      projection: { name: 1, email: 1 }
    });
    return result;
  }

  async findManyUsersByIds(ids: string[]): Promise<UserEntity[]> {
    if (ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return [];
    const users = await this.dbCollection.find({ _id: { $in: uniqueIds } }).toArray();
    const result = users.map((user) => this.mapper.toDomain(user));
    return result;
  }

  async findManyUsersByIdsIncludeNameUsernameAvatar(ids: string[]): Promise<UserEntity[]> {
    if (ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return [];
    const users = await this.dbCollection
      .find(
        { _id: { $in: uniqueIds } },
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
    const result = users.map((user) => this.mapper.toDomain(user));
    return result;
  }

  async updateMe(id: string, data: IUpdateMeInput): Promise<UserEntity | null> {
    const result = await this.update(id, data as Partial<UserEntity>, {
      projection: { password: 0, totpSecret: 0 }
    });
    return result;
  }

  async resetPassword(id: string, data: IResetPasswordInput): Promise<boolean> {
    const result = await this.dbCollection.updateOne(
      { _id: id },
      {
        $set: {
          password: data.password
        },
        $currentDate: { updatedAt: true }
      }
    );
    return result.modifiedCount > 0;
  }

  async changePassword(id: string, data: IChangePasswordInput): Promise<UserEntity | null> {
    const result = await this.dbCollection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          password: data.password
        },
        $currentDate: {
          updatedAt: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          totpSecret: 0
        }
      }
    );
    return result ? this.mapper.toDomain(result) : null;
  }
}
