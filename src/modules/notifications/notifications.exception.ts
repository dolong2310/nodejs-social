import { SharedInvalidCursorException } from '@/shared/exceptions/cursor.exception';
import { SharedUserNotFoundException } from '@/shared/exceptions/users.exception';

export const NotificationActorUserNotFoundException = SharedUserNotFoundException;
export const NotificationInvalidCursorException = SharedInvalidCursorException;
