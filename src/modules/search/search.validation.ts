import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { Injectable } from '@/decorators/injectable.decorator';
import { ESearchPeople, ESearchType } from '@/modules/search/search.enum';
import { validate } from '@/utils/validation.util';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

export interface ISearchValidation {
  searchValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

@Injectable()
export class SearchValidation implements ISearchValidation {
  constructor() {}

  searchValidation = validate(
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
              [ESearchType.USER, ESearchType.POST, ESearchType.IMAGE, ESearchType.VIDEO, ESearchType.VIDEO_HLS]
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
