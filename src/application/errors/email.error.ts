import { BadRequestError } from '@/presentation/http/responses/error.response';

export const InvalidEmailTemplateException = new BadRequestError('Invalid template');
