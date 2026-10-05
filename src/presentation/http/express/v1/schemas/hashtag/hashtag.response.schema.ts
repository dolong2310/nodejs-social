import { type InferOutput, object, string } from 'valibot';
import { responseDateSchema } from '@/presentation/http/express/v1/schemas/common/response.schema';

export const HashtagResponseSchema = object({
  id: string(),
  name: string(),
  createdAt: responseDateSchema,
  updatedAt: responseDateSchema
});
export type HashtagResponse = InferOutput<typeof HashtagResponseSchema>;
