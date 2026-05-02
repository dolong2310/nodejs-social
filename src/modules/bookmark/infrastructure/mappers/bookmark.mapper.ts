import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { BookmarkEntity } from '@/modules/bookmark/domain/entities/bookmark.entity';
import { BookmarkModel, bookmarkSchema } from '@/modules/bookmark/domain/repositories/bookmark.model';
import { parse } from 'valibot';

export class BookmarkMapper implements Mapper<BookmarkEntity, BookmarkModel> {
  toPersistence(entity: BookmarkEntity): BookmarkModel {
    const clone = entity.getProps();
    const record: BookmarkModel = {
      _id: clone.id.toString(),
      userId: clone.userId,
      postId: clone.postId,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(bookmarkSchema, record);
  }
  toDomain(record: BookmarkModel): BookmarkEntity {
    const entity = new BookmarkEntity({
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
