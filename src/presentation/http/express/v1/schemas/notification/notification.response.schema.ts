import { EnumNotificationType } from '@/modules/notification/domain/entities/notification.types';
import { boolean, enum_, type InferOutput, nullish, object, string, unknown } from 'valibot';
import { responseDateSchema } from '@/presentation/http/express/v1/schemas/common/response.schema';

export const NotificationResponseSchema = object({
  id: string(),
  recipientId: string(),
  read: boolean(),
  readAt: nullish(responseDateSchema),
  type: enum_(EnumNotificationType),
  // actor/payload differ per notification type, they are passed through as-is.
  actor: unknown(),
  payload: unknown(),
  summary: string(),
  createdAt: responseDateSchema,
  updatedAt: responseDateSchema
});
export type NotificationResponse = InferOutput<typeof NotificationResponseSchema>;
