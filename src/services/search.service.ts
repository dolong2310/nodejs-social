import { config } from '@/config';
import { CACHE_KEYS } from '@/constants/cache.constant';
import type { IRedisService } from '@/database/redis/redis.service';
import { SearchQueryDTO } from '@/dtos/requests/search.request.dto';
import { PostDetailResponseDTO, PostNewFeedResponseDTO } from '@/dtos/responses/post.response.dto';
import { IUser } from '@/models/schemas/user.schema';
import { IBlockRepository } from '@/repositories/block.repository';
import { ISearchRepository } from '@/repositories/search.repository';
import { BaseService } from '@/services/base.service';
import { IFriendsService } from '@/services/friends.service';
import { IPostsService } from '@/services/posts.service';
import { redactNewFeedAuthor } from '@/utils/block-redaction.util';
import { ObjectId } from 'mongodb';

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

/** Search uses `findFollowedUserIds` for people_follow filters — backed by mutual friends (FriendsService). */
class SearchService extends BaseService implements ISearchService {
  constructor(
    private readonly searchRepository: ISearchRepository,
    private readonly friendsService: IFriendsService,
    private readonly postsService: IPostsService,
    private readonly blockRepository: IBlockRepository,
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
    const blockedAuthorIds = userId
      ? await this.blockRepository.listUserIdsBlockedInEitherDirection(new ObjectId(userId))
      : undefined;

    const extraVisiblePostIds =
      userId && blockedAuthorIds && blockedAuthorIds.length > 0
        ? await this.postsService.getExtraVisiblePostIdsForBlockedEngagement(userId, blockedAuthorIds)
        : [];
    const extraIdsArg = extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined;

    const postsPromise = this.searchRepository.findPosts({
      userId,
      query,
      type,
      peopleFollow: people_follow,
      page: Number(page),
      limit: Number(limit),
      findFollowedUserIds: this.friendsService.findFollowedUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraIdsArg
    });

    const totalPostsPromise = this.searchRepository.countPosts({
      userId,
      query,
      type,
      peopleFollow: people_follow,
      findFollowedUserIds: this.friendsService.findFollowedUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraIdsArg
    });

    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    if (userId && blockedAuthorIds && blockedAuthorIds.length > 0) {
      const viewerOid = new ObjectId(userId);
      const blockedHex = new Set(blockedAuthorIds.filter((id) => !id.equals(viewerOid)).map((b) => b.toHexString()));
      for (const p of posts) {
        const row = p as PostDetailResponseDTO & { author?: { _id: ObjectId } };
        if (row.author && blockedHex.has(row.author._id.toHexString())) {
          redactNewFeedAuthor(row as unknown as PostNewFeedResponseDTO);
        }
      }
    }

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
