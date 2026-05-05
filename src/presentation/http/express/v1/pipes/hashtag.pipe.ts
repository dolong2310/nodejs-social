import { HASHTAG_NAME_REGEX } from '@/modules/common/constants/regex.constants';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { RequestHandlerType } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { checkSchema } from 'express-validator';

export interface IHashtagsPipe {
  hashtagIdParam(): RequestHandlerType;
  createBodyPipe(): RequestHandlerType;
  updateBodyPipe(): RequestHandlerType;
}

export class HashtagsPipe implements IHashtagsPipe {
  @AutoBind()
  hashtagIdParam() {
    return validate(
      checkSchema(
        {
          hashtagId: {
            notEmpty: { errorMessage: VALIDATION_ERROR_MESSAGE.HASHTAG_ID_IS_REQUIRED },
            isString: true,
            trim: true,
            custom: {
              options: (value: string) => {
                if (!isValidId(value)) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.HASHTAG_ID_INVALID);
                }
                return true;
              }
            }
          }
        },
        ['params']
      )
    );
  }

  @AutoBind()
  createBodyPipe() {
    return validate(
      checkSchema(
        {
          name: {
            notEmpty: { errorMessage: VALIDATION_ERROR_MESSAGE.HASHTAG_NAME_IS_REQUIRED },
            isString: true,
            trim: true,
            isLength: { options: { min: 1, max: 100 } },
            custom: {
              options: (value: string) => {
                if (!HASHTAG_NAME_REGEX.test(value)) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.HASHTAG_NAME_INVALID);
                }
                return true;
              }
            }
          }
        },
        ['body']
      )
    );
  }

  @AutoBind()
  updateBodyPipe() {
    return validate(
      checkSchema(
        {
          name: {
            optional: true,
            isString: true,
            trim: true,
            isLength: { options: { min: 1, max: 100 } },
            custom: {
              options: (value: string) => {
                if (!HASHTAG_NAME_REGEX.test(value)) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.HASHTAG_NAME_INVALID);
                }
                return true;
              }
            }
          }
        },
        ['body']
      )
    );
  }
}
