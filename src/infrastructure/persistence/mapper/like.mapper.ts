import { LikeEntity } from '@/domain/entities/like.entity';
import { ILikeModel } from '@/infrastructure/persistence/mongodb/models/like.model';
import { ObjectId } from 'mongodb';

export class LikeMapper {
  toPersistence(entity: Partial<LikeEntity>): ILikeModel {
    const clone = entity;
    const record: ILikeModel = {
      _id: new ObjectId(clone.id),
      userId: new ObjectId(clone.userId),
      postId: new ObjectId(clone.postId),
      createdAt: clone.createdAt ? new Date(clone.createdAt) : new Date()
    };
    return record;
  }
  toDomain(record: ILikeModel): LikeEntity {
    return LikeEntity.create({
      id: record._id?.toString() ?? '',
      userId: record.userId.toString(),
      postId: record.postId.toString(),
      createdAt: record.createdAt ?? new Date()
    });
  }
  toResponse() {}
}
