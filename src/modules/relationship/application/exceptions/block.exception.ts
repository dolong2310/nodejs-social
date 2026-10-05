import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class CannotBlockYourselfException extends ExceptionBase {
  readonly code = 'BLOCK.CANNOT_BLOCK_SELF';
  readonly type = 'invalid_argument';
}

export class BlockAlreadyExistsException extends ExceptionBase {
  readonly code = 'BLOCK.ALREADY_EXISTS';
  readonly type = 'conflict';
}

export class NoActiveBlockException extends ExceptionBase {
  readonly code = 'BLOCK.NO_ACTIVE_BLOCK';
  readonly type = 'not_found';
}
