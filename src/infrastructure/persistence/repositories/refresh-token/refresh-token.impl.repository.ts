import { LoggerPort } from '@/application/ports/logger.port';
import { RefreshTokenEntity } from '@/domain/entities/refresh-token/refresh-token.entity';
import { RefreshTokenRepositoryPort } from '@/domain/repositories/refresh-token/refresh-token.repository';
import {
  ICreateRefreshTokenInput,
  IRotateRefreshTokenInput
} from '@/domain/repositories/refresh-token/refresh-token.repository.type';
import { MongoRepositoryBase } from '@/infrastructure/persistence/repositories/base/base.mongo.repository';
import { RefreshTokenMapper } from '@/infrastructure/persistence/repositories/refresh-token/refresh-token.mapper';
import { RefreshTokenModel } from '@/infrastructure/persistence/repositories/refresh-token/refresh-token.model';
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
