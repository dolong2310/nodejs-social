import type { BasePipe } from '@/presentation/http/express/core/base.pipe';
import { UnprocessableEntityException } from '@/presentation/http/express/responses/error.response';
import { HTTP_ERROR_MESSAGE } from '@/presentation/http/express/responses/http-message.constants';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constants';
import type { ExpressRequest, RequestSchemas } from '@/presentation/http/express/types';
import {
  type FieldValidationError,
  mapValibotIssues,
  type RequestLocation
} from '@/presentation/http/express/utils/valibot-error.util';
import { safeParseAsync } from 'valibot';

const LOCATIONS: readonly RequestLocation[] = ['params', 'query', 'headers', 'body'];

/**
 * Validates and transforms `params`, `query`, `headers` and `body` with valibot schemas.
 * - On failure: throws 422 with every invalid field (first issue per field).
 * - On success: replaces `body`, `params` and `query` with the parsed output (headers are only validated).
 */
class ValidationPipe<TSchemas extends RequestSchemas> implements BasePipe {
  constructor(private readonly schemas: TSchemas) {}

  async transform(req: ExpressRequest): Promise<void> {
    const errors: Record<string, FieldValidationError> = {};
    const outputs: Partial<Record<RequestLocation, unknown>> = {};

    for (const location of LOCATIONS) {
      const schema = this.schemas[location];
      if (!schema) continue;

      // No `abortPipeEarly`: cross-field checks of every field must still run; the mapper keeps the first issue per field.
      const result = await safeParseAsync(schema, this.getInput(req, location));

      if (result.success) {
        outputs[location] = result.output;
      } else {
        Object.assign(errors, mapValibotIssues(result.issues, location));
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException(
        HTTP_ERROR_MESSAGE.UNPROCESSABLE_ENTITY,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        errors
      );
    }

    if ('params' in outputs) req.params = outputs.params;
    if ('body' in outputs) req.body = outputs.body;
    if ('query' in outputs) {
      // Express 5 exposes `req.query` as a getter that re-parses the URL on every read.
      Object.defineProperty(req, 'query', {
        value: outputs.query,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  }

  private getInput(req: ExpressRequest, location: RequestLocation): unknown {
    // No body parser matched (e.g. empty PATCH) → treat as an empty object so optional-only schemas pass.
    if (location === 'body') return req.body ?? {};
    return req[location];
  }
}

export const validate = <const TSchemas extends RequestSchemas>(schemas: TSchemas): ValidationPipe<TSchemas> =>
  new ValidationPipe(schemas);
