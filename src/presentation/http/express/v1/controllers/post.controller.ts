import type { BookmarkPostPort } from '@/modules/post/application/use-cases/bookmark-post/bookmark-post.port';
import type { CreatePostPort } from '@/modules/post/application/use-cases/create-post/create-post.port';
import type { DeletePostPort } from '@/modules/post/application/use-cases/delete-post/delete-post.port';
import type { GetGuestNewFeedsPort } from '@/modules/post/application/use-cases/get-guest-new-feeds/get-guest-new-feeds.port';
import type { GetNewFeedsPort } from '@/modules/post/application/use-cases/get-new-feeds/get-new-feeds.port';
import { EnumNewFeedFilter } from '@/modules/post/domain/entities/post.types';
import {
  type GetPostDetailPort,
  GetPostDetailInputPort
} from '@/modules/post/application/use-cases/get-post-detail/get-post-detail.port';
import {
  type GetPostsByUserPort,
  GetPostsByUserInputPort
} from '@/modules/post/application/use-cases/get-posts-by-user/get-posts-by-user.port';
import {
  type GetPostsByUserInteractionPort,
  GetPostsByUserInteractionInputPort
} from '@/modules/post/application/use-cases/get-posts-by-user-interaction/get-posts-by-user-interaction.port';
import type { GetPostsTypePort } from '@/modules/post/application/use-cases/get-posts-type/get-posts-type.port';
import type { IncreaseViewsPort } from '@/modules/post/application/use-cases/increase-views/increase-views.port';
import type { CreateLikePort } from '@/modules/post/application/use-cases/like-post/like-post.port';
import type { UnbookmarkPostPort } from '@/modules/post/application/use-cases/unbookmark-post/unbookmark-post.port';
import type { UnlikePort } from '@/modules/post/application/use-cases/unlike-post/unlike-post.port';
import type { UpdatePostPort } from '@/modules/post/application/use-cases/update-post/update-post.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import type { ValidatedRequest } from '@/presentation/http/express/types';
import type { CursorPaginationQuerySchema } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import type {
  CreatePostBodySchema,
  NewFeedsQuerySchema,
  PatchPostBodySchema,
  PostIdBodySchema,
  PostIdParamsSchema,
  PostsByUserParamsSchema,
  PostsByUserQuerySchema,
  PostsTypeParamsSchema
} from '@/presentation/http/express/v1/schemas/post/post.request.schema';
import type {
  PostDetailWithAuthorResponse,
  PostInteractionResponse,
  PostResponse
} from '@/presentation/http/express/v1/schemas/post/post.response.schema';

type NewFeedsRequest = ValidatedRequest<{ query: typeof NewFeedsQuerySchema }>;
type PostIdRequest = ValidatedRequest<{ params: typeof PostIdParamsSchema }>;
type PostsByUserRequest = ValidatedRequest<{
  params: typeof PostsByUserParamsSchema;
  query: typeof PostsByUserQuerySchema;
}>;
type PostsTypeRequest = ValidatedRequest<{
  params: typeof PostsTypeParamsSchema;
  query: typeof CursorPaginationQuerySchema;
}>;
type InteractionListRequest = ValidatedRequest<{ query: typeof CursorPaginationQuerySchema }>;
type CreatePostRequest = ValidatedRequest<{ body: typeof CreatePostBodySchema }>;
type PatchPostRequest = ValidatedRequest<{ params: typeof PostIdParamsSchema; body: typeof PatchPostBodySchema }>;
type PostIdBodyRequest = ValidatedRequest<{ body: typeof PostIdBodySchema }>;

export interface IPostController {
  getNewFeeds(req: NewFeedsRequest): Promise<unknown>;
  getPostDetail(req: PostIdRequest): Promise<unknown>;
  getPostsByUser(req: PostsByUserRequest): Promise<unknown>;
  getPostsType(req: PostsTypeRequest): Promise<unknown>;
  getUserLikedPosts(req: InteractionListRequest): Promise<unknown>;
  getUserBookmarkedPosts(req: InteractionListRequest): Promise<unknown>;
  createPost(req: CreatePostRequest): Promise<unknown>;
  patchPost(req: PatchPostRequest): Promise<unknown>;
  deletePost(req: PostIdRequest): Promise<unknown>;
  createBookmark(req: PostIdBodyRequest): Promise<unknown>;
  deleteBookmark(req: PostIdRequest): Promise<unknown>;
  createLike(req: PostIdBodyRequest): Promise<unknown>;
  deleteLike(req: PostIdRequest): Promise<unknown>;
}

@AutoBind()
export class PostController extends BaseController implements IPostController {
  constructor(
    private readonly getNewFeedsUC: GetNewFeedsPort,
    private readonly getGuestNewFeedsUC: GetGuestNewFeedsPort,
    private readonly getPostDetailUC: GetPostDetailPort,
    private readonly increaseViewsUC: IncreaseViewsPort,
    private readonly getPostsTypeUC: GetPostsTypePort,
    private readonly getPostsByUserUC: GetPostsByUserPort,
    private readonly getPostsByUserInteractionUC: GetPostsByUserInteractionPort,
    private readonly createPostUC: CreatePostPort,
    private readonly updatePostUC: UpdatePostPort,
    private readonly deletePostUC: DeletePostPort,
    private readonly createBookmarkUC: BookmarkPostPort,
    private readonly unbookmarkPostUC: UnbookmarkPostPort,
    private readonly createLikeUC: CreateLikePort,
    private readonly unlikeUC: UnlikePort
  ) {
    super();
  }

  async getNewFeeds(req: NewFeedsRequest) {
    const { cursor, limit, filter } = req.query;
    const userId = this.getUserId(req, { optional: true });

    let items: PostDetailWithAuthorResponse[];
    let nextCursor: string | null;

    if (userId) {
      const results = await this.getNewFeedsUC.execute<PostDetailWithAuthorResponse>({
        userId,
        cursor,
        limit,
        filter: filter ?? EnumNewFeedFilter.FOR_YOU
      });

      items = results.items;
      nextCursor = results.nextCursor;
    } else {
      const guestResults = await this.getGuestNewFeedsUC.execute<PostDetailWithAuthorResponse>({
        cursor,
        limit
      });

      items = guestResults.items;
      nextCursor = guestResults.nextCursor;
    }

    return this.cursorPaginatedResponse<PostDetailWithAuthorResponse>({
      items,
      nextCursor,
      message: 'Get new feeds successfully'
    });
  }

  async getPostsByUser(req: PostsByUserRequest) {
    const { userId: targetUserId } = req.params;
    const { cursor, limit, type } = req.query;
    const currentUserId = this.getUserId(req, { optional: true }) || undefined;

    const { items, nextCursor } = await this.getPostsByUserUC.execute<PostDetailWithAuthorResponse>(
      new GetPostsByUserInputPort({
        targetUserId,
        currentUserId,
        type,
        cursor,
        limit
      })
    );

    return this.cursorPaginatedResponse<PostDetailWithAuthorResponse>({
      items,
      nextCursor,
      message: 'Get posts by user successfully'
    });
  }

  async getPostDetail(req: PostIdRequest) {
    const { postId } = req.params;
    const userId = this.getUserId(req, { optional: true });
    const postDetail = await this.getPostDetailUC.execute(
      new GetPostDetailInputPort({ postId, currentUserId: userId })
    );

    const updatedViews = await this.increaseViewsUC.execute({ postId, userId });
    const post: PostDetailWithAuthorResponse = updatedViews
      ? {
          ...postDetail,
          userViews: updatedViews.userViews,
          guestViews: updatedViews.guestViews,
          updatedAt: updatedViews.updatedAt!
        }
      : postDetail;

    return this.response<PostDetailWithAuthorResponse>({
      data: post,
      message: 'Get post detail successfully'
    });
  }

  async getPostsType(req: PostsTypeRequest) {
    const { postId, type } = req.params;
    const { cursor, limit } = req.query;
    const userId = this.getUserId(req, { optional: true });

    const { items, nextCursor } = await this.getPostsTypeUC.execute<PostDetailWithAuthorResponse>({
      userId,
      postId,
      type,
      cursor,
      limit
    });

    return this.cursorPaginatedResponse<PostDetailWithAuthorResponse>({
      items,
      nextCursor,
      message: 'Get posts type successfully'
    });
  }

  async getUserLikedPosts(req: InteractionListRequest) {
    const userId = this.getUserId(req);
    const { cursor, limit } = req.query;
    const { items, nextCursor } = await this.getPostsByUserInteractionUC.execute<PostDetailWithAuthorResponse>(
      new GetPostsByUserInteractionInputPort({
        userId,
        interaction: 'likes',
        cursor,
        limit
      })
    );

    return this.cursorPaginatedResponse<PostDetailWithAuthorResponse>({
      items,
      nextCursor,
      message: 'Get liked posts successfully'
    });
  }

  async getUserBookmarkedPosts(req: InteractionListRequest) {
    const userId = this.getUserId(req);
    const { cursor, limit } = req.query;
    const { items, nextCursor } = await this.getPostsByUserInteractionUC.execute<PostDetailWithAuthorResponse>(
      new GetPostsByUserInteractionInputPort({
        userId,
        interaction: 'bookmarks',
        cursor,
        limit
      })
    );

    return this.cursorPaginatedResponse<PostDetailWithAuthorResponse>({
      items,
      nextCursor,
      message: 'Get bookmarked posts successfully'
    });
  }

  async createPost(req: CreatePostRequest) {
    const userId = this.getUserId(req);
    const body = req.body;

    const post = await this.createPostUC.execute({
      userId,
      type: body.type,
      parentId: body.parentId,
      content: body.content,
      audience: body.audience,
      allowStrangerComments: body.allowStrangerComments,
      media: body.media,
      hashtags: body.hashtags,
      mentions: body.mentions
    });

    return this.response<PostResponse>({
      instance: Created,
      data: post,
      message: 'Create post successfully'
    });
  }

  async patchPost(req: PatchPostRequest) {
    const userId = this.getUserId(req);
    const { postId } = req.params;
    const body = req.body;

    const post = await this.updatePostUC.execute({
      userId,
      postId,
      audience: body.audience,
      allowStrangerComments: body.allowStrangerComments,
      content: body.content,
      media: body.media,
      hashtags: body.hashtags,
      mentions: body.mentions
    });

    return this.response<PostResponse>({
      data: post,
      message: 'Post updated successfully'
    });
  }

  async deletePost(req: PostIdRequest) {
    const userId = this.getUserId(req);
    const roleId = req.tokenPayload?.roleId ?? '';
    const { postId } = req.params;

    await this.deletePostUC.execute({
      postId,
      userId,
      roleId
    });

    return this.response({
      message: 'Post deleted successfully'
    });
  }

  async createBookmark(req: PostIdBodyRequest) {
    const userId = this.getUserId(req);
    const body = req.body;

    const bookmark = await this.createBookmarkUC.execute({
      userId,
      postId: body.postId
    });

    return this.response<PostInteractionResponse>({
      instance: Created,
      data: bookmark,
      message: 'Bookmark post successfully'
    });
  }

  async deleteBookmark(req: PostIdRequest) {
    const userId = this.getUserId(req);
    const { postId } = req.params;

    await this.unbookmarkPostUC.execute({
      userId,
      postId
    });

    return this.response({
      message: 'Unbookmark post successfully'
    });
  }

  async createLike(req: PostIdBodyRequest) {
    const userId = this.getUserId(req);
    const body = req.body;

    const like = await this.createLikeUC.execute({
      userId,
      postId: body.postId
    });

    return this.response<PostInteractionResponse>({
      instance: Created,
      data: like,
      message: 'Post liked successfully'
    });
  }

  async deleteLike(req: PostIdRequest) {
    const userId = this.getUserId(req);
    const { postId } = req.params;

    const like = await this.unlikeUC.execute({
      userId,
      postId
    });

    return this.response<PostInteractionResponse>({
      data: like,
      message: 'Like removed successfully'
    });
  }
}
