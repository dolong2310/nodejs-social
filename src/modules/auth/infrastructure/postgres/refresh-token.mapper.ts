import { RefreshTokenEntity } from '@/modules/auth/domain/entities/refresh-token.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { RefreshTokenModel, refreshTokenSchema } from '@/modules/auth/infrastructure/postgres/refresh-token.model';
import { parse } from 'valibot';

export class RefreshTokenMapper implements Mapper<RefreshTokenEntity, RefreshTokenModel> {
  toPersistence(entity: RefreshTokenEntity): RefreshTokenModel {
    const clone = entity.getProps();
    const record: RefreshTokenModel = {
      id: clone.id.toString(),
      user_id: clone.userId,
      token: clone.token,
      expires_at: clone.expiresAt,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(refreshTokenSchema, record);
  }
  toDomain(record: RefreshTokenModel): RefreshTokenEntity {
    const entity = new RefreshTokenEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        userId: record.user_id,
        token: record.token,
        expiresAt: record.expires_at
      }
    });
    return entity;
  }
  toResponse() {}
}
