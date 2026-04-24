import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { CreateLikeProps, LikeProps } from '@/domain/entities/like/like.type';

export class LikeEntity extends Entity<LikeProps> {
  static create(createProps: CreateLikeProps) {
    const id = new UniqueEntityID();
    const props: LikeProps = { ...createProps };
    const like = new LikeEntity({ id, props });
    return like;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
