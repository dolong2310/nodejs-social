import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { LikeEntity } from '@/modules/like/domain/entities/like.entity';
import { LikeModel, likeSchema } from '@/modules/like/infrastructure/mongo/like.model';
import { parse } from 'valibot';

export class LikeMapper implements Mapper<LikeEntity, LikeModel> {
  toPersistence(entity: LikeEntity): LikeModel {
    const clone = entity.getProps();
    const record: LikeModel = {
      _id: clone.id.toString(),
      user_id: clone.userId,
      post_id: clone.postId,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(likeSchema, record);
  }
  toDomain(record: LikeModel): LikeEntity {
    const entity = new LikeEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        userId: record.user_id,
        postId: record.post_id
      }
    });
    return entity;
  }
  toResponse() {}
}
