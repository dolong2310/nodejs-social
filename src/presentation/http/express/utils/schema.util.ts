import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import {
  type BaseIssue,
  type ErrorMessage,
  type ObjectEntries,
  type ObjectIssue,
  type ObjectSchema,
  type StrictObjectIssue,
  type StrictObjectSchema,
  type StringIssue,
  type StringSchema,
  object,
  safeParse,
  strictObject,
  string
} from 'valibot';

/**
 * Valibot reports a missing key, an unknown key and a non-object input through the object's own message.
 * This resolves a field-specific message instead:
 * - unknown key (strict only) → FIELD_IS_NOT_ALLOWED
 * - missing key → the message the entry schema produces for `undefined` (e.g. "Name is required")
 * - input is not an object → REQUEST_DATA_MUST_BE_AN_OBJECT
 */
function objectMessage<TIssue extends BaseIssue<unknown>>(entries: ObjectEntries): ErrorMessage<TIssue> {
  return (issue) => {
    const pathItem = issue.path?.at(-1);
    if (!pathItem) {
      return VALIDATION_ERROR_MESSAGE.REQUEST_DATA_MUST_BE_AN_OBJECT;
    }

    if (issue.expected === 'never') {
      return VALIDATION_ERROR_MESSAGE.FIELD_IS_NOT_ALLOWED;
    }

    const entry = entries[pathItem.key as string];
    const entryIssue = entry ? safeParse(entry, undefined).issues?.[0] : undefined;
    return entryIssue?.message ?? VALIDATION_ERROR_MESSAGE.FIELD_IS_REQUIRED;
  };
}

/**
 * Schema for `body` / `params`: rejects unknown fields with 422.
 */
export function requestObject<const TEntries extends ObjectEntries>(
  entries: TEntries
): StrictObjectSchema<TEntries, ErrorMessage<StrictObjectIssue>> {
  return strictObject(entries, objectMessage<StrictObjectIssue>(entries));
}

/**
 * Schema for `query`: silently strips unknown fields (utm_*, cache-busters...).
 */
export function queryObject<const TEntries extends ObjectEntries>(
  entries: TEntries
): ObjectSchema<TEntries, ErrorMessage<ObjectIssue>> {
  return object(entries, objectMessage<ObjectIssue>(entries));
}

/**
 * String schema that distinguishes a missing value from a value of the wrong type.
 */
export function requiredString(messages: {
  required: string;
  invalid: string;
}): StringSchema<ErrorMessage<StringIssue>> {
  return string((issue) => (issue.input === undefined || issue.input === null ? messages.required : messages.invalid));
}
