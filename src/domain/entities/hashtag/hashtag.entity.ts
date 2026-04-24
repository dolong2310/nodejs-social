import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { CreateHashtagProps, HashtagProps } from '@/domain/entities/hashtag/hashtag.type';

export class HashtagEntity extends Entity<HashtagProps> {
  static create(createProps: CreateHashtagProps) {
    const id = new UniqueEntityID();
    const props: HashtagProps = { ...createProps };
    const hashtag = new HashtagEntity({ id, props });
    return hashtag;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
