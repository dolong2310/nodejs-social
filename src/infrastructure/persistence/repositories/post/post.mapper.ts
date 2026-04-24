import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { PostEntity } from '@/domain/entities/post/post.entity';
import { Media } from '@/domain/value-objects/media.value-object';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import { PostModel, postSchema } from '@/infrastructure/persistence/repositories/post/post.model';
import { parse } from 'valibot';

export class PostMapper implements Mapper<PostEntity, PostModel> {
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
  toResponse() {}
}
