import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { CreateLikeProps, LikeProps } from '@/modules/like/domain/entities/like.type';

export class LikeEntity extends Entity<LikeProps> {
  static create(createProps: CreateLikeProps) {
    const id = new UniqueEntityID(generatePrefixId('like'));
    const props: LikeProps = { ...createProps };
    const like = new LikeEntity({ id, props });
    return like;
  }

  validate(): void {
    const { userId, postId } = this.getProps();
    invariant(userId.trim().length > 0, new ArgumentNotProvidedException('User ID is required'));
    invariant(postId.trim().length > 0, new ArgumentNotProvidedException('Post ID is required'));
  }
}
