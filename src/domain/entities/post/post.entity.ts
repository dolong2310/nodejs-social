import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { PostProps, CreatePostProps } from '@/domain/entities/post/post.type';

export class PostEntity extends Entity<PostProps> {
  static create(createProps: CreatePostProps) {
    const id = new UniqueEntityID();
    const props: PostProps = {
      ...createProps
    };
    const post = new PostEntity({ id, props });
    return post;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
