import { BadRequestError } from '@/providers/httpResponses/error.response';

export const InvalidEmailTemplateException = new BadRequestError('Invalid template');
