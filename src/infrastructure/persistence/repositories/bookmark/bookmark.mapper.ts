import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { BookmarkEntity } from '@/domain/entities/bookmark/bookmark.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import { BookmarkModel, bookmarkSchema } from '@/infrastructure/persistence/repositories/bookmark/bookmark.model';
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
