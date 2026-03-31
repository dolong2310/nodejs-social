import { AuthFailureError } from '@/providers';
import {
  SharedUserIsBannedException,
  SharedUserNotFoundException,
  SharedUserNotVerifiedYetException,
  TokenInvalidException
} from '@/shared';

export const SocketUnauthorizedException = new AuthFailureError();
export const SocketTokenInvalidException = TokenInvalidException;
export const SocketUserNotFoundException = SharedUserNotFoundException;
export const SocketUserNotVerifiedException = SharedUserNotVerifiedYetException;
export const SocketUserBannedException = SharedUserIsBannedException;
export const SocketEventUnauthorizedError = new Error('Unauthorized');
