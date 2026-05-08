import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { LikeEntity } from '@/modules/post/domain/entities/like.entity';
import { LikeFullProps } from '@/modules/post/domain/entities/like.type';
import { LikeModel, likeSchema } from '@/modules/post/infrastructure/persistence/postgres/like.model';
import { parse } from 'valibot';

export class LikeMapper implements Mapper<LikeEntity, LikeModel, LikeFullProps> {
  toPersistence(entity: LikeEntity): LikeModel {
    const clone = entity.getProps();
    const record: LikeModel = {
      id: clone.id.toString(),
      user_id: clone.userId,
      post_id: clone.postId,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(likeSchema, record);
  }
  toDomain(record: LikeModel): LikeEntity {
    return new LikeEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        userId: record.user_id,
        postId: record.post_id
      }
    });
  }
  toResponse(record: LikeModel): LikeFullProps {
    return {
      id: record.id,
      userId: record.user_id,
      postId: record.post_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
