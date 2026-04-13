import {
  SharedUserIsBannedException,
  SharedUserNotFoundException,
  SharedUserNotVerifiedYetException
} from '@/application/errors/common/user.error';
import { TokenInvalidException } from '@/application/errors/token.error';
import { AuthFailureError } from '@/presentation/http/responses/error.response';

export const SocketUnauthorizedException = new AuthFailureError();
export const SocketTokenInvalidException = TokenInvalidException;
export const SocketUserNotFoundException = SharedUserNotFoundException;
export const SocketUserNotVerifiedException = SharedUserNotVerifiedYetException;
export const SocketUserBannedException = SharedUserIsBannedException;
export const SocketEventUnauthorizedError = new Error('Unauthorized');
