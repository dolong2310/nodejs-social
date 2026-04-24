import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { BlockProps, CreateBlockProps } from '@/domain/entities/block/block.type';

export class BlockEntity extends Entity<BlockProps> {
  static create(createProps: CreateBlockProps) {
    const id = new UniqueEntityID();
    const props: BlockProps = { ...createProps };
    const block = new BlockEntity({ id, props });
    return block;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
