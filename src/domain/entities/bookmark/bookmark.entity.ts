import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { BookmarkProps, CreateBookmarkProps } from '@/domain/entities/bookmark/bookmark.type';

export class BookmarkEntity extends Entity<BookmarkProps> {
  static create(createProps: CreateBookmarkProps) {
    const id = new UniqueEntityID();
    const props: BookmarkProps = { ...createProps };
    const bookmark = new BookmarkEntity({ id, props });
    return bookmark;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
