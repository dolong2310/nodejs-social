import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import { PostFullProps } from '@/modules/post/domain/entities/post.type';
import { Media } from '@/modules/post/domain/value-objects/media.value-object';
import { PostModel, postSchema } from '@/modules/post/infrastructure/persistence/mongo/post.model';
import { parse } from 'valibot';

export class PostMapper implements Mapper<PostEntity, PostModel, PostFullProps> {
  toPersistence(entity: PostEntity): PostModel {
    const clone = entity.getProps();
    const record: PostModel = {
      _id: clone.id.toString(),
      user_id: clone.userId,
      type: clone.type,
      audience: clone.audience,
      allow_stranger_comments: clone.allowStrangerComments,
      content: clone.content,
      parent_id: clone.parentId,
      hashtags: clone.hashtags,
      mentions: clone.mentions,
      media: clone.media.map((media) => ({ url: media.raw().url, type: media.raw().type })),
      guest_views: clone.guestViews ?? 0,
      user_views: clone.userViews ?? 0,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(postSchema, record);
  }
  toDomain(record: PostModel): PostEntity {
    const entity = new PostEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        userId: record.user_id,
        type: record.type,
        audience: record.audience,
        allowStrangerComments: record.allow_stranger_comments,
        content: record.content,
        parentId: record.parent_id,
        hashtags: record.hashtags,
        mentions: record.mentions,
        media: record.media.map((media) => new Media({ url: media.url, type: media.type })),
        guestViews: record.guest_views,
        userViews: record.user_views
      }
    });
    return entity;
  }
  toResponse(record: PostModel): PostFullProps {
    return {
      id: record._id,
      userId: record.user_id,
      type: record.type,
      audience: record.audience,
      allowStrangerComments: record.allow_stranger_comments,
      content: record.content,
      parentId: record.parent_id,
      hashtags: record.hashtags,
      mentions: record.mentions,
      media: record.media.map((media) => new Media({ url: media.url, type: media.type })),
      guestViews: record.guest_views,
      userViews: record.user_views,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
