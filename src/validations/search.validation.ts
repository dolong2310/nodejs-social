import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ESearchPeopleFollow, ESearchType } from '@/enums/search.enum';
import { validate } from '@/utils/validation.util';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

export interface ISearchValidation {
  searchValidation: RequestHandler<ParamsDictionary, any, any, Query, Record<string, any>>;
}

class SearchValidation implements ISearchValidation {
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
        people_follow: {
          isIn: {
            options: [[ESearchPeopleFollow.FOLLOWING, ESearchPeopleFollow.NOT_FOLLOWING, ESearchPeopleFollow.ONLY_ME]],
            errorMessage: VALIDATION_ERROR_MESSAGE.PEOPLE_FOLLOW_MUST_BE_ONE_OF_THE_FOLLOWING
          },
          trim: true,
          optional: true
        }
      },
      ['query']
    )
  );
}

export default SearchValidation;
