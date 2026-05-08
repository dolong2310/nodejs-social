import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class HashtagNotFoundException extends ExceptionBase {
  readonly code = 'HASHTAG.NOT_FOUND';
  readonly statusCode = 404;
}

export class HashtagNameAlreadyExistsException extends ExceptionBase {
  readonly code = 'HASHTAG.NAME_ALREADY_EXISTS';
  readonly statusCode = 409;
}
