import { ISearchRepository } from '@/domain/repositories/search/search.repository';

import { CACHE_KEYS, CACHE_TTL } from '@/application/common/constants/cache.constant';
import { decodeCursorOrThrow } from '@/application/common/cursor-codec/cursor-decoder.codec';
import { decodePostFeedCursor, encodePostFeedCursor } from '@/application/common/cursor-codec/post-feed.cursor-codec';
import { transformUnknownAuthor } from '@/application/common/utils/transform-unknown-user.util';
import { PostNewFeedResultDTO } from '@/application/dtos/post/post.result.dto';
import { SearchPayloadDTO } from '@/application/dtos/search/search.payload.dto';
import { SearchPostsResultDTO, SearchUsersResultDTO } from '@/application/dtos/search/search.result.dto';
import { SharedInvalidCursorException } from '@/application/errors/pagination.error';
import { IFriendsService } from '@/application/ports/friend.port';
import { IPostsService } from '@/application/ports/post.port';
import { IRedisService } from '@/application/ports/redis.port';
import { ISearchService } from '@/application/ports/search.port';
import { BaseService } from '@/application/use-cases/base.service';

export class SearchService extends BaseService implements ISearchService {
  constructor(
    private readonly searchRepository: ISearchRepository,
    private readonly friendsService: IFriendsService,
    private readonly postsService: IPostsService,
    private readonly redis: IRedisService
  ) {
    super();
    this.findFriendUserIds = this.findFriendUserIds.bind(this);
  }

  async searchPosts({
    userId,
    query = '',
    type,
    people,
    cursor,
    limit
  }: SearchPayloadDTO): Promise<SearchPostsResultDTO> {
    // Lấy danh sách tác giả bị block (nếu đang đăng nhập)
    let blockedAuthorIds: string[] | undefined;

    if (userId) {
      const { blockedUserIds } = await this.postsService.listBlockedUserIdsEitherDirectionCached({ userId });
      blockedAuthorIds = blockedUserIds;
    }

    // nếu viewer từng tương tác (like/bookmark/comment) với bài của các tác giả bị block, thì vẫn lấy ra postId của các bài đó để hiển thị (Unknown user)
    let extraVisiblePostIds: string[] = [];
    if (userId && blockedAuthorIds && blockedAuthorIds.length > 0) {
      const result = await this.postsService.getExtraVisiblePostIdsForBlockedEngagement({
        userId,
        blockedAuthorIds
      });
      extraVisiblePostIds = result.extraVisiblePostIds;
    }

    const extraIdsArg = extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined;

    const before = decodeCursorOrThrow(cursor, decodePostFeedCursor, SharedInvalidCursorException);
    const rows = await this.searchRepository.findPostsForSearch({
      userId,
      query,
      type,
      people,
      cursor: before,
      limit,
      findFriendUserIds: this.findFriendUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraIdsArg
    });
    const hasMore = rows.length > limit;
    const posts = rows.slice(0, limit);

    // Redact (ẩn danh) tác giả nếu post thuộc người bị block
    if (userId && blockedAuthorIds && blockedAuthorIds.length > 0) {
      const blockedIds = new Set(blockedAuthorIds.filter((id) => id !== userId));
      for (const post of posts) {
        if (post.author && blockedIds.has(post.author.id)) {
          transformUnknownAuthor(post as unknown as PostNewFeedResultDTO);
        }
      }
    }

    // Cập nhật lượt xem cho các bài vừa load
    const updatedPosts = this.postsService.updatePostsViews<PostNewFeedResultDTO>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodePostFeedCursor(last.createdAt, last.id) : null;

    return new SearchPostsResultDTO({ items: updatedPosts, nextCursor });
  }

  async searchUsers({ userId, query = '', people, cursor, limit }: SearchPayloadDTO): Promise<SearchUsersResultDTO> {
    const before = decodeCursorOrThrow(cursor, decodePostFeedCursor, SharedInvalidCursorException);

    const load = async (): Promise<SearchUsersResultDTO> => {
      const rows = await this.searchRepository.findUsersForSearch({
        userId,
        query,
        people,
        cursor: before,
        limit,
        findFriendUserIds: this.findFriendUserIds
      });
      const hasMore = rows.length > limit;
      const users = rows.slice(0, limit);
      const last = users[users.length - 1];
      const nextCursor = hasMore && last?.createdAt ? encodePostFeedCursor(last.createdAt, last.id) : null;
      return new SearchUsersResultDTO({ items: users, nextCursor });
    };

    if (CACHE_TTL.SEARCH_USERS <= 0) {
      return load();
    }

    const key = CACHE_KEYS.searchUsers({
      userId,
      query,
      people,
      cursor,
      limit
    });

    return this.redis.getOrSet(key, load, CACHE_TTL.SEARCH_USERS);
  }

  private async findFriendUserIds(userId: string): Promise<string[]> {
    const response = await this.friendsService.findFriendUserIds({ userId });
    return response.friendUserIds;
  }
}
