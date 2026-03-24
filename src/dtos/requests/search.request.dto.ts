import { PaginationQueryDTO } from '@/dtos/requests/common.request.dto';
import { ESearchPeople, ESearchType } from '@/enums/search.enum';

export interface SearchQueryDTO extends PaginationQueryDTO {
  query: string;
  type?: ESearchType;
  people?: ESearchPeople;
}
