import { ESearchPeople, ESearchType } from '@/modules';
import { PaginationQueryDTO } from '@/shared';

export interface SearchQueryDTO extends PaginationQueryDTO {
  query: string;
  type?: ESearchType;
  people?: ESearchPeople;
}
