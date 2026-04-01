import { BadRequestError } from '@/providers/httpResponses/error.response';

export const GoogleAccountNotVerifiedException = new BadRequestError('Google account is not verified');
