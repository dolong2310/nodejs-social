import { HASHTAG_NAME_REGEX } from '@/modules/common/constants/regex.constants';
import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import {
  ArgumentInvalidException,
  ArgumentNotProvidedException,
  ArgumentOutOfRangeException
} from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { CreateHashtagProps, HashtagProps } from '@/modules/hashtag/domain/entities/hashtag.type';

export class HashtagEntity extends Entity<HashtagProps> {
  static create(createProps: CreateHashtagProps) {
    const id = new UniqueEntityID(generatePrefixId('hashtag'));
    const props: HashtagProps = { ...createProps };
    const hashtag = new HashtagEntity({ id, props });
    return hashtag;
  }

  validate(): void {
    const { name } = this.getProps();
    invariant(name.trim().length > 0, new ArgumentNotProvidedException('Hashtag name is required'));
    invariant(
      HASHTAG_NAME_REGEX.test(name),
      new ArgumentInvalidException('Hashtag name must contain only letters, digits, or underscores')
    );
    invariant(name.length <= 100, new ArgumentOutOfRangeException('Hashtag name must not exceed 100 characters'));
  }
}
