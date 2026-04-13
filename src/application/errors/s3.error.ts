import { NotFoundError } from '@/presentation/http/responses/error.response';

export const S3ObjectNotFoundException = new NotFoundError();
