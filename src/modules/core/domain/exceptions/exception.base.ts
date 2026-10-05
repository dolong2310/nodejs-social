/**
 * What kind of failure an exception represents, independent of any transport.
 * Adapters translate it (e.g. the HTTP layer maps `not_found` to 404).
 */
export type ExceptionType =
  | 'invalid_argument'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'too_large'
  | 'range_not_satisfiable'
  | 'rate_limited'
  | 'unavailable'
  | 'internal';

export interface NormalizedException {
  message: string;
  code: string;
  type: ExceptionType;
  stack?: string;
  cause?: string;
  /**
   * ^ Consider adding optional `metadata` object to
   * exceptions (if language doesn't support anything
   * similar by default) and pass some useful technical
   * information about the exception when throwing.
   * This will make debugging easier.
   */
  metadata?: Record<string, unknown>;
}

export abstract class ExceptionBase extends Error {
  abstract code: string;
  abstract type: ExceptionType;

  /**
   * @param {string} message
   * @param {ObjectLiteral} [metadata={}]
   * **BE CAREFUL** not to include sensitive info in 'metadata'
   * to prevent leaks since all exception's data will end up
   * in application's log files. Only include non-sensitive
   * info that may help with debugging.
   */
  constructor(
    readonly message: string = '',
    cause?: Error,
    readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): NormalizedException {
    return {
      message: this.message,
      code: this.code,
      type: this.type,
      stack: this.stack,
      cause: JSON.stringify(this.cause),
      metadata: this.metadata
    };
  }
}
