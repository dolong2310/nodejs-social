import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { LikeEntity } from '@/domain/entities/like/like.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import { LikeModel, likeSchema } from '@/infrastructure/persistence/repositories/like/like.model';
import { parse } from 'valibot';

export class LikeMapper implements Mapper<LikeEntity, LikeModel> {
  toPersistence(entity: LikeEntity): LikeModel {
    const clone = entity.getProps();
    const record: LikeModel = {
      _id: clone.id.toString(),
      userId: clone.userId,
      postId: clone.postId,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(likeSchema, record);
  }
  toDomain(record: LikeModel): LikeEntity {
    const entity = new LikeEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        userId: record.userId,
        postId: record.postId
      }
    });
    return entity;
  }
  toResponse() {}
}
