import { config } from '@/config';
import { CACHE_KEYS } from '@/constants';
import { Injectable } from '@/decorators';
import {
  BaseService,
  BlockRepository,
  FriendsService,
  IUser,
  PostDetailResponseDTO,
  PostNewFeedResponseDTO,
  PostsService,
  SearchQueryDTO,
  SearchRepository
} from '@/modules';
import { RedisService } from '@/providers';
import { redactNewFeedAuthor } from '@/utils';

export interface ISearchService {
  searchPosts(
    payload: SearchQueryDTO & {
      userId?: string;
    }
  ): Promise<[PostDetailResponseDTO[], number]>;
  searchUsers(
    payload: SearchQueryDTO & {
      userId?: string;
    }
  ): Promise<[IUser[], number]>;
}

/** Search uses `findFriendUserIds` for `people` query filter (mutual friends via FriendsService). */
@Injectable()
export class SearchService extends BaseService implements ISearchService {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly friendsService: FriendsService,
    private readonly postsService: PostsService,
    private readonly blockRepository: BlockRepository,
    private readonly redis: RedisService
  ) {
    super();
  }

  async searchPosts({
    userId,
    query,
    type,
    people,
    page,
    limit
  }: SearchQueryDTO & {
    userId?: string;
  }): Promise<[PostDetailResponseDTO[], number]> {
    const blockedAuthorIds = userId
      ? await this.blockRepository.listUserIdsBlockedInEitherDirection(userId)
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
      people,
      page: Number(page),
      limit: Number(limit),
      findFriendUserIds: this.friendsService.findFriendUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraIdsArg
    });

    const totalPostsPromise = this.searchRepository.countPosts({
      userId,
      query,
      type,
      people,
      findFriendUserIds: this.friendsService.findFriendUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraIdsArg
    });

    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    if (userId && blockedAuthorIds && blockedAuthorIds.length > 0) {
      const blockedHex = new Set(blockedAuthorIds.filter((id) => id !== userId));
      for (const p of posts) {
        const row = p as PostDetailResponseDTO & { author?: { _id: { toHexString(): string } } };
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
    people,
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
        people,
        page: Number(page),
        limit: Number(limit),
        findFriendUserIds: this.friendsService.findFriendUserIds
      });

      const totalUsersPromise = this.searchRepository.countUsers({
        userId,
        query,
        people,
        findFriendUserIds: this.friendsService.findFriendUserIds
      });
      return Promise.all([usersPromise, totalUsersPromise]);
    };

    if (ttl <= 0) {
      return load();
    }

    const key = CACHE_KEYS.searchUsers({
      userId,
      query,
      people,
      page,
      limit
    });

    return this.redis.getOrSet(key, load, ttl);
  }
}
