import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { queryObject, requestObject } from '@/presentation/http/express/utils/schema.util';
import { cursorPaginationQueryEntries } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import { idSchema } from '@/presentation/http/express/v1/schemas/common/primitives.schema';
import { array, optional, picklist, pipe, transform } from 'valibot';

const notificationIdSchema = idSchema({
  required: VALIDATION_ERROR_MESSAGE.NOTIFICATION_ID_IS_REQUIRED,
  invalid: VALIDATION_ERROR_MESSAGE.NOTIFICATION_ID_MUST_BE_A_STRING,
  format: VALIDATION_ERROR_MESSAGE.INVALID_NOTIFICATION_ID
});

export const NotificationListQuerySchema = queryObject({
  ...cursorPaginationQueryEntries,
  unreadOnly: optional(
    pipe(
      picklist(['true', 'false', '1', '0']),
      transform((value) => value === 'true' || value === '1')
    )
  )
});

export const MarkNotificationsReadBodySchema = requestObject({
  ids: optional(array(notificationIdSchema))
});

export const NotificationIdParamsSchema = requestObject({ notificationId: notificationIdSchema });
