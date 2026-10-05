import { EnumSearchPeople, EnumSearchType } from '@/modules/common/domain/enums/search.enum';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { queryObject } from '@/presentation/http/express/utils/schema.util';
import { cursorPaginationQueryEntries } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import { optional, picklist, pipe, string, trim } from 'valibot';

export const SearchQuerySchema = queryObject({
  ...cursorPaginationQueryEntries,
  query: optional(pipe(string(VALIDATION_ERROR_MESSAGE.SEARCH_QUERY_MUST_BE_A_STRING), trim()), ''),
  type: optional(
    pipe(
      string(VALIDATION_ERROR_MESSAGE.MEDIA_TYPE_MUST_BE_ONE_OF_THE_FOLLOWING),
      trim(),
      picklist(
        [
          EnumSearchType.USER,
          EnumSearchType.POST,
          EnumSearchType.IMAGE,
          EnumSearchType.VIDEO,
          EnumSearchType.VIDEO_STREAM
        ],
        VALIDATION_ERROR_MESSAGE.MEDIA_TYPE_MUST_BE_ONE_OF_THE_FOLLOWING
      )
    )
  ),
  people: optional(
    pipe(
      string(VALIDATION_ERROR_MESSAGE.PEOPLE_MUST_BE_ONE_OF_THE_FOLLOWING),
      trim(),
      picklist(
        [EnumSearchPeople.FRIENDS, EnumSearchPeople.NOT_FRIENDS, EnumSearchPeople.ONLY_ME],
        VALIDATION_ERROR_MESSAGE.PEOPLE_MUST_BE_ONE_OF_THE_FOLLOWING
      )
    )
  )
});
