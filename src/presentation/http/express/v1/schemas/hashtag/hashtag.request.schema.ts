import { HASHTAG_NAME_REGEX } from '@/modules/common/constants/regex.constants';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { requestObject, requiredString } from '@/presentation/http/express/utils/schema.util';
import { idSchema } from '@/presentation/http/express/v1/schemas/common/primitives.schema';
import { maxLength, nonEmpty, optional, pipe, regex, trim } from 'valibot';

const hashtagNameSchema = pipe(
  requiredString({
    required: VALIDATION_ERROR_MESSAGE.HASHTAG_NAME_IS_REQUIRED,
    invalid: VALIDATION_ERROR_MESSAGE.HASHTAG_NAME_INVALID
  }),
  trim(),
  nonEmpty(VALIDATION_ERROR_MESSAGE.HASHTAG_NAME_IS_REQUIRED),
  maxLength(100, VALIDATION_ERROR_MESSAGE.HASHTAG_NAME_INVALID),
  regex(HASHTAG_NAME_REGEX, VALIDATION_ERROR_MESSAGE.HASHTAG_NAME_INVALID)
);

export const HashtagIdParamsSchema = requestObject({
  hashtagId: idSchema({
    required: VALIDATION_ERROR_MESSAGE.HASHTAG_ID_IS_REQUIRED,
    invalid: VALIDATION_ERROR_MESSAGE.HASHTAG_ID_INVALID,
    format: VALIDATION_ERROR_MESSAGE.HASHTAG_ID_INVALID
  })
});

export const CreateHashtagBodySchema = requestObject({ name: hashtagNameSchema });

export const UpdateHashtagBodySchema = requestObject({ name: optional(hashtagNameSchema) });
