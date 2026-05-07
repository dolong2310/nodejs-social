import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { RefreshTokenEntity } from '@/modules/auth/domain/entities/refresh-token.entity';
import { RefreshTokenModel, refreshTokenSchema } from '@/modules/auth/infrastructure/mongo/refresh-token.model';
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
