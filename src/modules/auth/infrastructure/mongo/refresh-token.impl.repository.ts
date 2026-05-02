import { LoggerPort } from '@/modules/core/infrastructure/logger/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { RefreshTokenEntity } from '@/modules/auth/domain/entities/refresh-token.entity';
import { RefreshTokenRepositoryPort } from '@/modules/auth/domain/repositories/refresh-token.repository';
import {
  ICreateRefreshTokenInput,
  IRotateRefreshTokenInput
} from '@/modules/auth/domain/repositories/refresh-token.repository.type';
import { RefreshTokenMapper } from '@/modules/auth/infrastructure/mappers/refresh-token.mapper';
import { RefreshTokenModel } from '@/modules/auth/domain/repositories/refresh-token.model';
import { Db, MongoClient } from 'mongodb';

export class RefreshTokenRepository
  extends MongoRepositoryBase<RefreshTokenEntity, RefreshTokenModel>
  implements RefreshTokenRepositoryPort
{
  protected collectionName = 'refreshTokens';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: RefreshTokenMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async findRefreshToken(token: string): Promise<RefreshTokenEntity | null> {
    const result = await this.dbCollection.findOne({ token });
    return result ? this.mapper.toDomain(result) : null;
  }

  async createRefreshToken(data: ICreateRefreshTokenInput): Promise<RefreshTokenEntity> {
    const entity = RefreshTokenEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record);
    return this.mapper.toDomain(record);
  }

  async deleteRefreshToken(token: string): Promise<boolean> {
    const result = await this.dbCollection.deleteOne({ token });
    return result.deletedCount > 0;
  }

  async rotateRefreshToken({ userId, oldToken, newToken }: IRotateRefreshTokenInput): Promise<boolean> {
    const result = await this.dbCollection.updateOne(
      {
        userId: userId,
        token: oldToken
      },
      {
        $set: {
          token: newToken
        }
      }
    );
    return result.modifiedCount > 0;
  }
}
