import { ESearchPeople, ESearchType } from '@/domain/enums/search.enum';
import { CursorPaginationQueryDTO } from '@/presentation/http/dtos/common/common.request.dto';

export interface SearchCursorQueryDTO extends CursorPaginationQueryDTO {
  query?: string;
  type?: ESearchType;
  people?: ESearchPeople;
}
