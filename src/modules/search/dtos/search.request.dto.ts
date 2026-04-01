import { ESearchPeople, ESearchType } from '@/modules/search/search.enum';
import { PaginationQueryDTO } from '@/shared/dtos/common.request.dto';

export interface SearchQueryDTO extends PaginationQueryDTO {
  query: string;
  type?: ESearchType;
  people?: ESearchPeople;
}
