import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class CannotBlockYourselfException extends ExceptionBase {
  readonly code = 'BLOCK.CANNOT_BLOCK_SELF';
  readonly statusCode = 400;
}

export class BlockAlreadyExistsException extends ExceptionBase {
  readonly code = 'BLOCK.ALREADY_EXISTS';
  readonly statusCode = 409;
}

export class NoActiveBlockException extends ExceptionBase {
  readonly code = 'BLOCK.NO_ACTIVE_BLOCK';
  readonly statusCode = 404;
}
