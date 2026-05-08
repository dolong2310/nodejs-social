import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { BookmarkEntity } from '@/modules/post/domain/entities/bookmark.entity';
import { BookmarkFullProps } from '@/modules/post/domain/entities/bookmark.type';
import { BookmarkModel, bookmarkSchema } from '@/modules/post/infrastructure/persistence/postgres/bookmark.model';
import { parse } from 'valibot';

export class BookmarkMapper implements Mapper<BookmarkEntity, BookmarkModel, BookmarkFullProps> {
  toPersistence(entity: BookmarkEntity): BookmarkModel {
    const clone = entity.getProps();
    const record: BookmarkModel = {
      id: clone.id.toString(),
      user_id: clone.userId,
      post_id: clone.postId,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(bookmarkSchema, record);
  }
  toDomain(record: BookmarkModel): BookmarkEntity {
    return new BookmarkEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        userId: record.user_id,
        postId: record.post_id
      }
    });
  }
  toResponse(record: BookmarkModel): BookmarkFullProps {
    return {
      id: record.id,
      userId: record.user_id,
      postId: record.post_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
