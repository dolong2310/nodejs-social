import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class HashtagNotFoundException extends ExceptionBase {
  readonly code = 'HASHTAG.NOT_FOUND';
  readonly type = 'not_found';
}

export class HashtagNameAlreadyExistsException extends ExceptionBase {
  readonly code = 'HASHTAG.NAME_ALREADY_EXISTS';
  readonly type = 'conflict';
}
