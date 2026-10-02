import { type InferOutput, object, string } from 'valibot';

export const BlockCreatedResponseSchema = object({ userId: string() });
export type BlockCreatedResponse = InferOutput<typeof BlockCreatedResponseSchema>;
