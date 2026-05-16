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
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(likeSchema, record);
  }
  toDomain(record: LikeModel): LikeEntity {
    const entity = new LikeEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        userId: record.user_id,
        postId: record.post_id
      }
    });
    return entity;
  }
  toResponse(record: LikeModel): LikeFullProps {
    const response = {
      id: record.id,
      userId: record.user_id,
      postId: record.post_id,
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null
    };
    return response;
  }
}
