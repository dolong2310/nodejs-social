import { ESearchPeople, ESearchType } from '@/modules/common/domain/enums/search.enum';
import { CursorPaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';

export interface SearchCursorQueryDTO extends CursorPaginationQueryDTO {
  query?: string;
  type?: ESearchType;
  people?: ESearchPeople;
}
