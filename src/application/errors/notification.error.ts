import { SharedUserNotFoundException } from '@/application/errors/common/user.error';
import { SharedInvalidCursorException } from '@/application/errors/pagination.error';

export const NotificationActorUserNotFoundException = SharedUserNotFoundException;
export const NotificationInvalidCursorException = SharedInvalidCursorException;
