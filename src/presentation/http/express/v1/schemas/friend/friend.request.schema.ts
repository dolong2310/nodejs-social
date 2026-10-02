import { requestObject } from '@/presentation/http/express/utils/schema.util';
import { userIdSchema, usernameSchema } from '@/presentation/http/express/v1/schemas/common/primitives.schema';

export const SendFriendRequestBodySchema = requestObject({ username: usernameSchema });

export const IncomingRequestParamsSchema = requestObject({ fromUserId: userIdSchema });

export const OutgoingRequestParamsSchema = requestObject({ toUserId: userIdSchema });

export const UnfriendParamsSchema = requestObject({ userId: userIdSchema });
