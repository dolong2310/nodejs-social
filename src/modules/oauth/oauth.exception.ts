import { BadRequestError } from '@/providers';

export const GoogleAccountNotVerifiedException = new BadRequestError('Google account is not verified');
