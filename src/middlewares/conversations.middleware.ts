import { userIdSchema } from '@/middlewares/users.middleware';
import { validate } from '@/utils/validation.util';
import { checkSchema } from 'express-validator';

export const validateReceiverId = validate(
  checkSchema(
    {
      receiverId: userIdSchema
    },
    ['params']
  )
);
