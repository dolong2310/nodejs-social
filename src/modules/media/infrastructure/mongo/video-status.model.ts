import { EEncodingVideoStatus } from '@/modules/media/domain/entities/video-status.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, object, optional, pipe, string } from 'valibot';

export const videoStatusSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: string(),
  status: enum_(EEncodingVideoStatus),
  message: optional(string()),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type VideoStatusModel = InferOutput<typeof videoStatusSchema>;
