import { userIdSchema } from '@/middlewares/users.middleware';
import { validate } from '@/utils/validation.util';
import { checkSchema } from 'express-validator';

export const validateFollowUser = validate(
  checkSchema(
    {
      followedUserId: userIdSchema
    },
    ['body']
  )
);

export const validateUnfollowUser = validate(
  checkSchema(
    {
      userId: userIdSchema
    },
    ['params']
  )
);
