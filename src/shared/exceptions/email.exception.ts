import { BadRequestError } from '@/providers';

export const InvalidEmailTemplateException = new BadRequestError('Invalid template');
