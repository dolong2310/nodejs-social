import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { BlockProps, CreateBlockProps } from '@/modules/block/domain/entities/block.type';

export class BlockEntity extends Entity<BlockProps> {
  static create(createProps: CreateBlockProps) {
    const id = new UniqueEntityID(generatePrefixId('block'));
    const props: BlockProps = { ...createProps };
    const block = new BlockEntity({ id, props });
    return block;
  }

  validate(): void {
    const { blockerId, blockedId } = this.getProps();
    invariant(blockerId.trim().length > 0, new ArgumentNotProvidedException('Blocker ID is required'));
    invariant(blockedId.trim().length > 0, new ArgumentNotProvidedException('Blocked ID is required'));
    invariant(blockerId !== blockedId, new ArgumentInvalidException('A user cannot block themselves'));
  }
}
