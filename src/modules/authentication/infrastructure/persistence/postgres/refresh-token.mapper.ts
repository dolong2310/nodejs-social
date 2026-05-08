import { RefreshTokenEntity } from '@/modules/authentication/domain/entities/refresh-token.entity';
import { RefreshTokenFullProps } from '@/modules/authentication/domain/entities/refresh-token.type';
import {
  RefreshTokenModel,
  refreshTokenSchema
} from '@/modules/authentication/infrastructure/persistence/postgres/refresh-token.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class RefreshTokenMapper implements Mapper<RefreshTokenEntity, RefreshTokenModel, RefreshTokenFullProps> {
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
  toResponse(record: RefreshTokenModel): RefreshTokenFullProps {
    return {
      id: record.id,
      userId: record.user_id,
      token: record.token,
      expiresAt: record.expires_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
