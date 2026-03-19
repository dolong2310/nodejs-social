import { ISearchRequestQuery } from '@/models/requests/search.request';
import { IPostDetailResponse } from '@/models/responses/post.response';
import { IUser } from '@/models/schemas/user.schema';
import { ISearchRepository } from '@/repositories/search.repository';
import { BaseService } from '@/services/base.service';
import { IFollowersService } from '@/services/followers.service';
import { IPostsService } from '@/services/posts.service';

export interface ISearchService {
  searchPosts(
    payload: ISearchRequestQuery & {
      userId?: string;
    }
  ): Promise<[IPostDetailResponse[], number]>;
  searchUsers(
    payload: ISearchRequestQuery & {
      userId?: string;
    }
  ): Promise<[IUser[], number]>;
}

class SearchService extends BaseService implements ISearchService {
  constructor(
    private readonly searchRepository: ISearchRepository,
    private readonly followersService: IFollowersService,
    private readonly postsService: IPostsService
  ) {
    super();
  }

  async searchPosts({
    userId,
    query,
    type,
    people_follow,
    page,
    limit
  }: ISearchRequestQuery & {
    userId?: string;
  }): Promise<[IPostDetailResponse[], number]> {
    const postsPromise = this.searchRepository.findPosts({
      userId,
      query,
      type,
      peopleFollow: people_follow,
      page: Number(page),
      limit: Number(limit),
      findFollowedUserIds: this.followersService.findFollowedUserIds
    });

    const totalPostsPromise = this.searchRepository.countPosts({
      userId,
      query,
      type,
      peopleFollow: people_follow,
      findFollowedUserIds: this.followersService.findFollowedUserIds
    });

    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    const updatedPosts = await this.postsService.updatePostsViews<IPostDetailResponse>({ posts, userId });

    return [updatedPosts, totalPosts];
  }

  async searchUsers({
    userId,
    query,
    people_follow,
    page,
    limit
  }: ISearchRequestQuery & {
    userId?: string;
  }): Promise<[IUser[], number]> {
    // Tìm kiếm users theo query (tìm kiếm theo name, username, email)
    // Nếu có userId (có nghĩa là đang login) thì có thể filter theo people follow, nếu không thì chỉ tìm tất cả users

    const usersPromise = this.searchRepository.findUsers({
      userId,
      query,
      peopleFollow: people_follow,
      page: Number(page),
      limit: Number(limit),
      findFollowedUserIds: this.followersService.findFollowedUserIds
    });

    const totalUsersPromise = this.searchRepository.countUsers({
      userId,
      query,
      peopleFollow: people_follow,
      findFollowedUserIds: this.followersService.findFollowedUserIds
    });
    const [users, totalUsers] = await Promise.all([usersPromise, totalUsersPromise]);

    return [users, totalUsers];
  }
}

export default SearchService;
