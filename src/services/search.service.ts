import { config } from '@/config';
import { CACHE_KEYS } from '@/constants/cache.constant';
import type { IRedisService } from '@/database/redis/redis.service';
import { SearchQueryDTO } from '@/dtos/requests/search.request.dto';
import { PostDetailResponseDTO } from '@/dtos/responses/post.response.dto';
import { IUser } from '@/models/schemas/user.schema';
import { ISearchRepository } from '@/repositories/search.repository';
import { BaseService } from '@/services/base.service';
import { IFriendsService } from '@/services/friends.service';
import { IPostsService } from '@/services/posts.service';

export interface ISearchService {
  searchPosts(
    payload: SearchQueryDTO & {
      userId?: string;
      peopleFollow?: string;
    }
  ): Promise<[PostDetailResponseDTO[], number]>;
  searchUsers(
    payload: SearchQueryDTO & {
      userId?: string;
      peopleFollow?: string;
    }
  ): Promise<[IUser[], number]>;
}

class SearchService extends BaseService implements ISearchService {
  constructor(
    private readonly searchRepository: ISearchRepository,
    private readonly friendsService: IFriendsService,
    private readonly postsService: IPostsService,
    private readonly redis: IRedisService
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
  }: SearchQueryDTO & {
    userId?: string;
  }): Promise<[PostDetailResponseDTO[], number]> {
    const postsPromise = this.searchRepository.findPosts({
      userId,
      query,
      type,
      peopleFollow: people_follow,
      page: Number(page),
      limit: Number(limit),
      findFollowedUserIds: this.friendsService.findFollowedUserIds
    });

    const totalPostsPromise = this.searchRepository.countPosts({
      userId,
      query,
      type,
      peopleFollow: people_follow,
      findFollowedUserIds: this.friendsService.findFollowedUserIds
    });

    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    const updatedPosts = await this.postsService.updatePostsViews<PostDetailResponseDTO>({ posts, userId });

    return [updatedPosts, totalPosts];
  }

  async searchUsers({
    userId,
    query,
    people_follow,
    page,
    limit
  }: SearchQueryDTO & {
    userId?: string;
  }): Promise<[IUser[], number]> {
    const ttl = config.searchCache.ttlSeconds;

    const load = async (): Promise<[IUser[], number]> => {
      const usersPromise = this.searchRepository.findUsers({
        userId,
        query,
        peopleFollow: people_follow,
        page: Number(page),
        limit: Number(limit),
        findFollowedUserIds: this.friendsService.findFollowedUserIds
      });

      const totalUsersPromise = this.searchRepository.countUsers({
        userId,
        query,
        peopleFollow: people_follow,
        findFollowedUserIds: this.friendsService.findFollowedUserIds
      });
      return Promise.all([usersPromise, totalUsersPromise]);
    };

    if (ttl <= 0) {
      return load();
    }

    const key = CACHE_KEYS.searchUsers({
      userId,
      query,
      people_follow,
      page,
      limit
    });

    return this.redis.getOrSet(key, load, ttl);
  }
}

export default SearchService;
