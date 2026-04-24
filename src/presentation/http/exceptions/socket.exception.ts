import { AuthFailureError } from '@/presentation/http/responses/error.response';

export const SocketUnauthorizedError = new AuthFailureError('Unauthorized');
