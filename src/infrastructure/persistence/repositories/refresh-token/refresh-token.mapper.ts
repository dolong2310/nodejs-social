import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { RefreshTokenEntity } from '@/domain/entities/refresh-token/refresh-token.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import {
  RefreshTokenModel,
  refreshTokenSchema
} from '@/infrastructure/persistence/repositories/refresh-token/refresh-token.model';
import { parse } from 'valibot';

export class RefreshTokenMapper implements Mapper<RefreshTokenEntity, RefreshTokenModel> {
  toPersistence(entity: RefreshTokenEntity): RefreshTokenModel {
    const clone = entity.getProps();
    const record: RefreshTokenModel = {
      _id: clone.id.toString(),
      userId: clone.userId,
      token: clone.token,
      expiresAt: clone.expiresAt,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(refreshTokenSchema, record);
  }
  toDomain(record: RefreshTokenModel): RefreshTokenEntity {
    const entity = new RefreshTokenEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        userId: record.userId,
        token: record.token,
        expiresAt: record.expiresAt
      }
    });
    return entity;
  }
  toResponse() {}
}
