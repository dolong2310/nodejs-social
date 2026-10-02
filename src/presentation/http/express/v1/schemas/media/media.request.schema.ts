import { requestObject } from '@/presentation/http/express/utils/schema.util';
import { pipe, regex, string } from 'valibot';

/** A single path segment: letters, digits, `_`, `-`, `.` — never `.`/`..` (no path traversal). */
const FILE_SEGMENT_REGEX = /^(?!\.\.?$)[\w.-]+$/;
const fileSegmentSchema = pipe(string(), regex(FILE_SEGMENT_REGEX, 'Invalid file name'));

export const FilenameParamsSchema = requestObject({ filename: fileSegmentSchema });

export const VideoStreamIdParamsSchema = requestObject({ id: fileSegmentSchema });

export const VideoStreamSegmentParamsSchema = requestObject({
  id: fileSegmentSchema,
  version: fileSegmentSchema,
  segment: fileSegmentSchema
});
