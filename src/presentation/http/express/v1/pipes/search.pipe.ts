import { EnumSearchPeople, EnumSearchType } from '@/modules/common/domain/enums/search.enum';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { ExpressRequestHandler } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { checkSchema } from 'express-validator';

export interface ISearchPipe {
  searchPipe: ExpressRequestHandler;
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
              [
                EnumSearchType.USER,
                EnumSearchType.POST,
                EnumSearchType.IMAGE,
                EnumSearchType.VIDEO,
                EnumSearchType.VIDEO_STREAM
              ]
            ],
            errorMessage: VALIDATION_ERROR_MESSAGE.MEDIA_TYPE_MUST_BE_ONE_OF_THE_FOLLOWING
          },
          trim: true,
          optional: true
        },
        people: {
          isIn: {
            options: [[EnumSearchPeople.FRIENDS, EnumSearchPeople.NOT_FRIENDS, EnumSearchPeople.ONLY_ME]],
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
