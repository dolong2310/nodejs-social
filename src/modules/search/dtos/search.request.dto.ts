import { ESearchPeople, ESearchType } from '@/modules/search/search.enum';
import { CursorPaginationQueryDTO } from '@/shared/dtos/common.request.dto';

export interface SearchCursorQueryDTO extends CursorPaginationQueryDTO {
  query?: string;
  type?: ESearchType;
  people?: ESearchPeople;
}
