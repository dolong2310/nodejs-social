import { ESearchPeople, ESearchType } from '@/modules/common/domain/enums/search.enum';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { RequestHandlerType } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { checkSchema } from 'express-validator';

export interface ISearchPipe {
  searchPipe: RequestHandlerType;
}

export class SearchPipe implements ISearchPipe {
  searchPipe = validate(
    checkSchema(
      {
        query: {
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.SEARCH_QUERY_MUST_BE_A_STRING
          },
          trim: true,
          optional: true
        },
        type: {
          isIn: {
            options: [
              [ESearchType.USER, ESearchType.POST, ESearchType.IMAGE, ESearchType.VIDEO, ESearchType.VIDEO_STREAM]
            ],
            errorMessage: VALIDATION_ERROR_MESSAGE.MEDIA_TYPE_MUST_BE_ONE_OF_THE_FOLLOWING
          },
          trim: true,
          optional: true
        },
        people: {
          isIn: {
            options: [[ESearchPeople.FRIENDS, ESearchPeople.NOT_FRIENDS, ESearchPeople.ONLY_ME]],
            errorMessage: VALIDATION_ERROR_MESSAGE.PEOPLE_MUST_BE_ONE_OF_THE_FOLLOWING
          },
          trim: true,
          optional: true
        }
      },
      ['query']
    )
  );
}
