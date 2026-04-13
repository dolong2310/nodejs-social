import { AggregateRoot } from '@/modules/core/domain-base/entities/aggregate.base';
import type { FileProps } from '@/modules/file/helpers/file.types';

export class FileEntity extends AggregateRoot<FileProps> {
  validate(): void {
    throw new Error('Method not implemented.');
  }
}
