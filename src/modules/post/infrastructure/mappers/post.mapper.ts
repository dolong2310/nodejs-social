import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import { PostFullProps } from '@/modules/post/domain/entities/post.type';
import { Media } from '@/modules/core/domain/value-objects/media.value-object';
import { PostModel, postSchema } from '@/modules/post/domain/repositories/post.model';
import { parse } from 'valibot';

export class PostMapper implements Mapper<PostEntity, PostModel, PostFullProps> {
  toPersistence(entity: PostEntity): PostModel {
    const clone = entity.getProps();
    const record: PostModel = {
      _id: clone.id.toString(),
      userId: clone.userId,
      type: clone.type,
      audience: clone.audience,
      allowStrangerComments: clone.allowStrangerComments,
      content: clone.content,
      parentId: clone.parentId,
      hashtags: clone.hashtags,
      mentions: clone.mentions,
      media: clone.media.map((media) => ({ url: media.raw().url, type: media.raw().type })),
      guestViews: clone.guestViews ?? 0,
      userViews: clone.userViews ?? 0,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(postSchema, record);
  }
  toDomain(record: PostModel): PostEntity {
    const entity = new PostEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        userId: record.userId,
        type: record.type,
        audience: record.audience,
        allowStrangerComments: record.allowStrangerComments,
        content: record.content,
        parentId: record.parentId,
        hashtags: record.hashtags,
        mentions: record.mentions,
        media: record.media.map((media) => new Media({ url: media.url, type: media.type })),
        guestViews: record.guestViews,
        userViews: record.userViews
      }
    });
    return entity;
  }
  toResponse(record: PostModel): PostFullProps {
    return {
      id: record._id,
      userId: record.userId,
      type: record.type,
      audience: record.audience,
      allowStrangerComments: record.allowStrangerComments,
      content: record.content,
      parentId: record.parentId,
      hashtags: record.hashtags,
      mentions: record.mentions,
      media: record.media.map((media) => new Media({ url: media.url, type: media.type })),
      guestViews: record.guestViews,
      userViews: record.userViews,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
