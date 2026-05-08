import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { EEncodingVideoStatus } from '@/modules/media/domain/entities/video-status.type';
import { type InferOutput, date, enum_, minLength, nullable, object, pipe, string } from 'valibot';

export const videoStatusSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: string(),
  status: enum_(EEncodingVideoStatus),
  message: nullable(string(), null),
  created_at: date(),
  updated_at: date()
});

export type VideoStatusModel = InferOutput<typeof videoStatusSchema>;
