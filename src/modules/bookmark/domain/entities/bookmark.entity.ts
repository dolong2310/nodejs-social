import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { BookmarkProps, CreateBookmarkProps } from '@/modules/bookmark/domain/entities/bookmark.type';

export class BookmarkEntity extends Entity<BookmarkProps> {
  static create(createProps: CreateBookmarkProps) {
    const id = new UniqueEntityID(generatePrefixId('bookmark'));
    const props: BookmarkProps = { ...createProps };
    const bookmark = new BookmarkEntity({ id, props });
    return bookmark;
  }

  validate(): void {
    const { userId, postId } = this.getProps();
    invariant(userId.trim().length > 0, new ArgumentNotProvidedException('User ID is required'));
    invariant(postId.trim().length > 0, new ArgumentNotProvidedException('Post ID is required'));
  }
}
