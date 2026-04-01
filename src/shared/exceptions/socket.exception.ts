import { AuthFailureError } from '@/providers/httpResponses/error.response';
import { TokenInvalidException } from '@/shared/exceptions/token.exception';
import {
  SharedUserIsBannedException,
  SharedUserNotFoundException,
  SharedUserNotVerifiedYetException
} from '@/shared/exceptions/users.exception';

export const SocketUnauthorizedException = new AuthFailureError();
export const SocketTokenInvalidException = TokenInvalidException;
export const SocketUserNotFoundException = SharedUserNotFoundException;
export const SocketUserNotVerifiedException = SharedUserNotVerifiedYetException;
export const SocketUserBannedException = SharedUserIsBannedException;
export const SocketEventUnauthorizedError = new Error('Unauthorized');
