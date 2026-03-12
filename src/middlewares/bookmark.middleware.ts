import { postIdSchema } from '@/middlewares/posts.middleware';
import { validate } from '@/utils/validation.util';
import { checkSchema } from 'express-validator';

export const validateCreateBookmark = validate(
  checkSchema(
    {
      postId: postIdSchema
    },
    ['body']
  )
);

export const validateDeleteBookmark = validate(
  checkSchema(
    {
      postId: postIdSchema
    },
    ['params']
  )
);
