import { CACHE_KEYS, CACHE_TTL } from '@/constants/cache.constant';
import { Injectable } from '@/decorators/injectable.decorator';
import { ICursorPaginationResult } from '@/interfaces/types/cursor.type';
import { BaseService } from '@/modules/base/base.service';
import { FriendsService } from '@/modules/friends/friends.service';
import { PostDetailResponseDTO, PostNewFeedResponseDTO } from '@/modules/posts/dtos/posts.response.dto';
import { PostsService } from '@/modules/posts/posts.service';
import { SearchCursorQueryDTO } from '@/modules/search/dtos/search.request.dto';
import { SearchRepository } from '@/modules/search/search.repository';
import { IUser } from '@/modules/users/users.schema';
import { RedisService } from '@/providers/database/redis/redis.service';
import { SharedInvalidCursorException } from '@/shared/exceptions/cursor.exception';
import { redactNewFeedAuthor } from '@/utils/block-redaction.util';
import { decodeCursorOrThrow } from '@/utils/cursor-pagination.util';
import { decodePostFeedCursor, encodePostFeedCursor } from '@/utils/post-feed-cursor.util';

export interface ISearchService {
  searchPosts(
    payload: SearchCursorQueryDTO & { userId?: string }
  ): Promise<ICursorPaginationResult<PostDetailResponseDTO>>;
  searchUsers(payload: SearchCursorQueryDTO & { userId?: string }): Promise<ICursorPaginationResult<IUser>>;
}

@Injectable()
export class SearchService extends BaseService implements ISearchService {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly friendsService: FriendsService,
    private readonly postsService: PostsService,
    private readonly redis: RedisService
  ) {
    super();
  }

  async searchPosts({
    userId,
    query = '',
    type,
    people,
    cursor,
    limit
  }: SearchCursorQueryDTO & { userId?: string }): Promise<ICursorPaginationResult<PostDetailResponseDTO>> {
    // Lấy danh sách tác giả bị block (nếu đang đăng nhập)
    const blockedAuthorIds = userId
      ? await this.postsService.listBlockedUserIdsEitherDirectionCached(userId)
      : undefined;

    // nếu viewer từng tương tác (like/bookmark/comment) với bài của các tác giả bị block, thì vẫn lấy ra postId của các bài đó để hiển thị (Unknown user)
    const extraVisiblePostIds =
      userId && blockedAuthorIds && blockedAuthorIds.length > 0
        ? await this.postsService.getExtraVisiblePostIdsForBlockedEngagement(userId, blockedAuthorIds)
        : [];
    const extraIdsArg = extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined;

    const numLimit = Number(limit);
    const before = decodeCursorOrThrow(cursor, decodePostFeedCursor, SharedInvalidCursorException);
    const rows = await this.searchRepository.findPostsForSearch({
      userId,
      query,
      type,
      people,
      cursor: before,
      limit: numLimit,
      findFriendUserIds: this.friendsService.findFriendUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraIdsArg
    });
    const hasMore = rows.length > numLimit;
    const posts = rows.slice(0, numLimit);

    // Redact (ẩn danh) tác giả nếu post thuộc người bị block
    if (userId && blockedAuthorIds && blockedAuthorIds.length > 0) {
      const blockedIds = new Set(blockedAuthorIds.filter((id) => id !== userId));
      for (const p of posts) {
        const row = p as PostDetailResponseDTO & { author?: { _id: { toString(): string } } };
        if (row.author && blockedIds.has(row.author._id.toString())) {
          redactNewFeedAuthor(row as unknown as PostNewFeedResponseDTO);
        }
      }
    }

    // Cập nhật lượt xem cho các bài vừa load
    const updatedPosts = await this.postsService.updatePostsViews<PostDetailResponseDTO>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodePostFeedCursor(last.createdAt, last._id.toString()) : null;
    return { items: updatedPosts, nextCursor };
  }

  async searchUsers({
    userId,
    query = '',
    people,
    cursor,
    limit
  }: SearchCursorQueryDTO & { userId?: string }): Promise<ICursorPaginationResult<IUser>> {
    const numLimit = Number(limit);
    const before = decodeCursorOrThrow(cursor, decodePostFeedCursor, SharedInvalidCursorException);

    const load = async (): Promise<ICursorPaginationResult<IUser>> => {
      const rows = await this.searchRepository.findUsersForSearch({
        userId,
        query,
        people,
        cursor: before,
        limit: numLimit,
        findFriendUserIds: this.friendsService.findFriendUserIds
      });
      const hasMore = rows.length > numLimit;
      const users = rows.slice(0, numLimit);
      const last = users[users.length - 1];
      const nextCursor = hasMore && last?.createdAt ? encodePostFeedCursor(last.createdAt, last._id.toString()) : null;
      return { items: users, nextCursor };
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
}
