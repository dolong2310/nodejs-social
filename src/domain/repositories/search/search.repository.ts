import { PostNewFeedResultDTO } from '@/application/dtos/post/post.result.dto';
import { IUser } from '@/domain/entities/user.entity';
import { IFindPostsForSearchInput, IFindUsersForSearchInput } from '@/domain/repositories/search/search.interface';

export interface ISearchRepository {
  findPostsForSearch(data: IFindPostsForSearchInput): Promise<PostNewFeedResultDTO[]>;
  findUsersForSearch(data: IFindUsersForSearchInput): Promise<IUser[]>;
}
