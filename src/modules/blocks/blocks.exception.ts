import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { BadRequestError, ConflictRequestError, NotFoundError } from '@/providers';
import { SharedUserNotFoundException } from '@/shared';

export const CannotBlockYourselfException = new BadRequestError(VALIDATION_ERROR_MESSAGE.CANNOT_BLOCK_YOURSELF);
export const BlockUserNotFoundException = SharedUserNotFoundException;
export const BlockAlreadyExistsException = new ConflictRequestError(VALIDATION_ERROR_MESSAGE.BLOCK_ALREADY_EXISTS);
export const NoActiveBlockException = new NotFoundError(VALIDATION_ERROR_MESSAGE.NO_ACTIVE_BLOCK);
