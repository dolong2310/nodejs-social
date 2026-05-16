import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { EnumEncodingVideoStatus } from '@/modules/media/domain/entities/video-status.type';
import { type InferOutput, date, enum_, minLength, nullable, object, pipe, string } from 'valibot';

export const videoStatusSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: string(),
  status: enum_(EnumEncodingVideoStatus),
  message: nullable(string(), null),
  created_at: date(),
  created_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  updated_at: date(),
  updated_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  deleted_at: nullable(date(), null),
  deleted_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)
});

export type VideoStatusModel = InferOutput<typeof videoStatusSchema>;
