import { BookmarkEntity } from '@/domain/entities/bookmark.entity';
import { IBookmarkModel } from '@/infrastructure/persistence/mongodb/models/bookmark.model';
import { ObjectId } from 'mongodb';

export class BookmarkMapper {
  toPersistence(entity: Partial<BookmarkEntity>): IBookmarkModel {
    const clone = entity;
    const record: IBookmarkModel = {
      _id: new ObjectId(clone.id),
      userId: new ObjectId(clone.userId),
      postId: new ObjectId(clone.postId),
      createdAt: clone.createdAt ?? new Date()
    };
    return record;
  }
  toDomain(record: IBookmarkModel): BookmarkEntity {
    return BookmarkEntity.create({
      id: record._id?.toString() ?? '',
      userId: record.userId.toString(),
      postId: record.postId.toString(),
      createdAt: record.createdAt ?? new Date()
    });
  }
  toResponse() {}
}
