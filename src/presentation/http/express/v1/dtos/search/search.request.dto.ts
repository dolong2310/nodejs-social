import { EnumSearchPeople, EnumSearchType } from '@/modules/common/domain/enums/search.enum';
import { CursorPaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';

export interface SearchCursorQueryDTO extends CursorPaginationQueryDTO {
  query?: string;
  type?: EnumSearchType;
  people?: EnumSearchPeople;
}
