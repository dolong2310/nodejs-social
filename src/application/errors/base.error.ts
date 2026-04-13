import { SharedUserNotFoundException } from '@/application/errors/common/user.error';

export const MissingAuthenticatedUserException = SharedUserNotFoundException;
