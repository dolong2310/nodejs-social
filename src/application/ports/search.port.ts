import { SearchPayloadDTO } from '@/application/dtos/search/search.payload.dto';
import { SearchPostsResultDTO, SearchUsersResultDTO } from '@/application/dtos/search/search.result.dto';

export interface ISearchService {
  searchPosts(payload: SearchPayloadDTO): Promise<SearchPostsResultDTO>;
  searchUsers(payload: SearchPayloadDTO): Promise<SearchUsersResultDTO>;
}
