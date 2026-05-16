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
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(bookmarkSchema, record);
  }
  toDomain(record: BookmarkModel): BookmarkEntity {
    const entity = new BookmarkEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        userId: record.user_id,
        postId: record.post_id
      }
    });
    return entity;
  }
  toResponse(record: BookmarkModel): BookmarkFullProps {
    const response = {
      id: record.id,
      userId: record.user_id,
      postId: record.post_id,
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
