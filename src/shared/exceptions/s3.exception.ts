import { NotFoundError } from '@/providers/httpResponses/error.response';

export const S3ObjectNotFoundException = new NotFoundError();
