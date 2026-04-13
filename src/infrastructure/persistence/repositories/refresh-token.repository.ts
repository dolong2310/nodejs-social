import { IRefreshToken } from '@/domain/entities/refresh-token.entity';
import {
  ICreateRefreshTokenInput,
  IDeleteRefreshTokenInput,
  IFindRefreshTokenInput,
  IRotateRefreshTokenInput
} from '@/domain/repositories/refresh-token/refresh-token.interface';
import { IRefreshTokenRepository } from '@/domain/repositories/refresh-token/refresh-token.repository';

import { RefreshTokenMapper } from '@/infrastructure/persistence/mapper/refresh-token.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';

export class RefreshTokenRepository extends BaseRepository implements IRefreshTokenRepository {
  constructor(
    db: DatabaseService,
    private readonly refreshTokenMapper: RefreshTokenMapper
  ) {
    super(db);
  }

  async findRefreshToken(data: IFindRefreshTokenInput): Promise<IRefreshToken | null> {
    const refreshToken = this.refreshTokenMapper.toPersistence(data);
    const result = await this.db.refreshTokens.findOne({
      token: refreshToken.token
    });
    return result ? this.refreshTokenMapper.toDomain(result) : null;
  }

  async createRefreshToken(data: ICreateRefreshTokenInput): Promise<IRefreshToken> {
    const refreshToken = this.refreshTokenMapper.toPersistence(data);
    await this.db.refreshTokens.insertOne(refreshToken);
    return this.refreshTokenMapper.toDomain(refreshToken);
  }

  async deleteRefreshToken(data: IDeleteRefreshTokenInput): Promise<boolean> {
    const refreshToken = this.refreshTokenMapper.toPersistence(data);
    const result = await this.db.refreshTokens.deleteOne({ token: refreshToken.token });
    return result.deletedCount > 0;
  }

  async rotateRefreshToken(data: IRotateRefreshTokenInput): Promise<boolean> {
    const { oldToken, newToken } = data;
    const refreshToken = this.refreshTokenMapper.toPersistence(data);
    const result = await this.db.refreshTokens.updateOne(
      {
        token: oldToken,
        userId: refreshToken.userId
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
