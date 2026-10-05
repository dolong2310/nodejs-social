import { requestObject } from '@/presentation/http/express/utils/schema.util';
import { userIdSchema } from '@/presentation/http/express/v1/schemas/common/primitives.schema';

export const BlockUserBodySchema = requestObject({ userId: userIdSchema });

export const UnblockUserParamsSchema = requestObject({ userId: userIdSchema });
