import { BadRequestError } from '@/presentation/http/responses/error.response';

export const GoogleAccountNotVerifiedException = new BadRequestError('Google account is not verified');
