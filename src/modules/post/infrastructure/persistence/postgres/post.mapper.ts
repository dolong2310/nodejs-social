import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import { PostFullProps } from '@/modules/post/domain/entities/post.type';
import { Media } from '@/modules/post/domain/value-objects/media.value-object';
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
      hashtags: clone.hashtags,
      mentions: clone.mentions,
      media: clone.media.map((media) => media.value),
      guest_views: clone.guestViews ?? 0,
      user_views: clone.userViews ?? 0,
      created_at: clone.createdAt,
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(postSchema, record);
  }
  toDomain(record: PostModel): PostEntity {
    const entity = new PostEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        userId: record.user_id,
        type: record.type,
        audience: record.audience,
        allowStrangerComments: record.allow_stranger_comments,
        content: record.content,
        parentId: record.parent_id,
        hashtags: record.hashtags,
        mentions: record.mentions,
        media: record.media.map((media) => Media.create({ url: media.url, type: media.type })),
        guestViews: record.guest_views,
        userViews: record.user_views
      }
    });
    return entity;
  }
  toResponse(record: PostModel): PostFullProps {
    const response = {
      id: record.id,
      userId: record.user_id,
      type: record.type,
      audience: record.audience,
      allowStrangerComments: record.allow_stranger_comments,
      content: record.content,
      parentId: record.parent_id,
      hashtags: record.hashtags,
      mentions: record.mentions,
      media: record.media.map((media) => ({ url: media.url, type: media.type })),
      guestViews: record.guest_views,
      userViews: record.user_views,
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
