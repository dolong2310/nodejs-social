import { RefreshTokenEntity } from '@/domain/entities/refresh-token.entity';
import { IRefreshTokenModel } from '@/infrastructure/persistence/mongodb/models/refresh-token.model';
import { ObjectId } from 'mongodb';

export class RefreshTokenMapper {
  toPersistence(entity: Partial<RefreshTokenEntity>): IRefreshTokenModel {
    const clone = entity;
    const record: IRefreshTokenModel = {
      _id: new ObjectId(clone.id),
      userId: new ObjectId(clone.userId),
      token: clone.token ?? '',
      createdAt: clone.createdAt ?? new Date()
    };
    return record;
  }
  toDomain(record: IRefreshTokenModel): RefreshTokenEntity {
    const entity = RefreshTokenEntity.create({
      id: record._id?.toString() ?? '',
      token: record.token,
      userId: record.userId.toString(),
      createdAt: record.createdAt
    });
    return entity;
  }
  toResponse() {}
}
