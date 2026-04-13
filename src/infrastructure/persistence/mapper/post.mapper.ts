import { PostEntity } from '@/domain/entities/post.entity';
import { EPostAudience, EPostType } from '@/domain/enums/posts.enum';
import { IPostModel } from '@/infrastructure/persistence/mongodb/models/post.model';
import { ObjectId } from 'mongodb';

export class PostMapper {
  toPersistence(entity: Partial<PostEntity>): IPostModel {
    const clone = entity;
    const record: IPostModel = {
      _id: new ObjectId(clone.id),
      userId: new ObjectId(clone.userId),
      type: clone.type ?? EPostType.POST,
      audience: clone.audience ?? EPostAudience.PUBLIC,
      allowStrangerComments: clone.allowStrangerComments ?? false,
      content: clone.content ?? '',
      parentId: clone.parentId ? new ObjectId(clone.parentId) : null,
      hashtags: clone.hashtags ? clone.hashtags.map((hashtag) => new ObjectId(hashtag)) : [],
      mentions: clone.mentions ? clone.mentions.map((mention) => new ObjectId(mention)) : [],
      media: clone.media ?? [],
      guestViews: clone.guestViews ?? 0,
      userViews: clone.userViews ?? 0,
      createdAt: clone.createdAt ?? new Date(),
      updatedAt: clone.updatedAt ?? new Date()
    };
    return record;
  }
  toDomain(record: IPostModel): PostEntity {
    return PostEntity.create({
      id: record._id?.toString() ?? '',
      userId: record.userId.toString(),
      type: record.type,
      audience: record.audience,
      allowStrangerComments: record.allowStrangerComments,
      content: record.content,
      parentId: record.parentId?.toString() ?? null,
      hashtags: record.hashtags.map((hashtag) => hashtag.toString()),
      mentions: record.mentions.map((mention) => mention.toString()),
      media: record.media,
      guestViews: record.guestViews,
      userViews: record.userViews,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  }
  toResponse() {}
}
