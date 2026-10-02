import { InternalServerErrorException } from '@/presentation/http/express/responses/error.response';
import { SuccessResponse } from '@/presentation/http/express/responses/success.response';
import type { ControllerResult, RequestSchema } from '@/presentation/http/express/types';
import { type FlatErrors, flatten, safeParseAsync } from 'valibot';

/**
 * Thrown when a controller result does not match the route's response schema.
 * The client only gets a generic 500; `issues` is for the server log (pino serializes it with `err`).
 */
export class ResponseSerializationException extends InternalServerErrorException {
  constructor(readonly issues: FlatErrors<undefined>) {
    super();
  }
}

/**
 * Parses the controller result through the route's response schema.
 * Non-strict `object()` schemas strip every undeclared key, so sensitive fields (password, totpSecret...)
 * never leave the server. A mismatch is a server bug → 500 without leaking the unfiltered data.
 */
export async function serializeResponse(result: ControllerResult, schema?: RequestSchema): Promise<ControllerResult> {
  if (!schema || result === undefined) return result;

  const isSuccessResponse = result instanceof SuccessResponse;
  const data: unknown = isSuccessResponse ? result.data : result;
  const parsed = await safeParseAsync(schema, data);

  if (!parsed.success) {
    throw new ResponseSerializationException(flatten(parsed.issues));
  }

  if (isSuccessResponse) {
    result.data = parsed.output;
    return result;
  }

  return parsed.output;
}
