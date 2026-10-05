import { type BaseIssue, getDotPath } from 'valibot';

export type RequestLocation = 'body' | 'params' | 'query' | 'headers';

/**
 * Field error shape returned to API clients (kept identical to the former express-validator output).
 */
export interface FieldValidationError {
  type: 'field';
  value: unknown;
  msg: string;
  path: string;
  location: RequestLocation;
}

/**
 * Maps valibot issues to `{ [path]: FieldValidationError }`, keeping only the first issue per path.
 */
export function mapValibotIssues(
  issues: readonly BaseIssue<unknown>[],
  location: RequestLocation
): Record<string, FieldValidationError> {
  const errors: Record<string, FieldValidationError> = {};

  for (const issue of issues) {
    const path = getDotPath(issue) ?? '';
    const key = path || location;
    if (errors[key]) continue;

    errors[key] = {
      type: 'field',
      value: issue.path?.at(-1)?.value ?? issue.input,
      msg: issue.message,
      path,
      location
    };
  }

  return errors;
}
