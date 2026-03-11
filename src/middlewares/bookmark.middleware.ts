import HTTP_STATUS from '@/constants/httpStatus.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ErrorWithStatus } from '@/models/error.model';
import postsService from '@/services/posts.service';
import { validate } from '@/utils/validation.util';
import { checkSchema, ParamSchema } from 'express-validator';
import { ObjectId } from 'mongodb';

const postIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.POST_ID_IS_REQUIRED
  },
  isString: {
    errorMessage: VALIDATION_ERROR_MESSAGE.POST_ID_MUST_BE_A_STRING
  },
  trim: true,
  custom: {
    options: async (postId: string) => {
      if (!ObjectId.isValid(postId)) {
        throw new ErrorWithStatus({
          message: VALIDATION_ERROR_MESSAGE.INVALID_POST_ID,
          status: HTTP_STATUS.BAD_REQUEST
        });
      }

      const post = await postsService.findPostById(postId);
      if (!post) {
        throw new ErrorWithStatus({
          message: VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        });
      }

      return true;
    }
  }
};

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
