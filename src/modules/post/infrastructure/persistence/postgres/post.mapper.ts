import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import { PostFullProps } from '@/modules/post/domain/entities/post.type';
import { PostModel, postSchema } from '@/modules/post/infrastructure/persistence/postgres/post.model';
import { parse } from 'valibot';

export class PostMapper implements Mapper<PostEntity, PostModel, PostFullProps> {
  toPersistence(entity: PostEntity): PostModel {
    const clone = entity.getProps();
    const record: PostModel = {
      id: clone.id.toString(),
      user_id: clone.userId,
      type: clone.type,
      audience: clone.audience,
      allow_stranger_comments: clone.allowStrangerComments,
      content: clone.content,
      parent_id: clone.parentId,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(postSchema, record);
  }
  toDomain(record: PostModel): PostEntity {
    return new PostEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        userId: record.user_id,
        type: record.type,
        audience: record.audience,
        allowStrangerComments: record.allow_stranger_comments,
        content: record.content,
        parentId: record.parent_id
      }
    });
  }
  toResponse(record: PostModel): PostFullProps {
    return {
      id: record.id,
      userId: record.user_id,
      type: record.type,
      audience: record.audience,
      allowStrangerComments: record.allow_stranger_comments,
      content: record.content,
      parentId: record.parent_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
