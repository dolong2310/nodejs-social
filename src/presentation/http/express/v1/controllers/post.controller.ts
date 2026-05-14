import { BookmarkPostPort } from '@/modules/post/application/use-cases/bookmark-post/bookmark-post.port';
import { CreatePostPort } from '@/modules/post/application/use-cases/create-post/create-post.port';
import { GetGuestNewFeedsPort } from '@/modules/post/application/use-cases/get-guest-new-feeds/get-guest-new-feeds.port';
import { GetNewFeedsPort } from '@/modules/post/application/use-cases/get-new-feeds/get-new-feeds.port';
import {
  GetPostDetailPort,
  GetPostDetailQuery
} from '@/modules/post/application/use-cases/get-post-detail/get-post-detail.port';
import { GetPostsTypePort } from '@/modules/post/application/use-cases/get-posts-type/get-posts-type.port';
import { IncreaseViewsPort } from '@/modules/post/application/use-cases/increase-views/increase-views.port';
import { CreateLikePort } from '@/modules/post/application/use-cases/like-post/like-post.port';
import { UnbookmarkPostPort } from '@/modules/post/application/use-cases/unbookmark-post/unbookmark-post.port';
import { UnlikePort } from '@/modules/post/application/use-cases/unlike-post/unlike-post.port';
import { UpdatePostPort } from '@/modules/post/application/use-cases/update-post/update-post.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { CursorPaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import {
  CreateBookmarkRequestDTO,
  CreateLikeRequestDTO,
  CreatePostRequestDTO,
  DeleteBookmarkParamsDTO,
  DeleteLikeParamsDTO,
  GetPostDetailParamsDTO,
  GetPostsParamsDTO,
  PatchPostRequestDTO
} from '@/presentation/http/express/v1/dtos/post/post.request.dto';
import {
  CreateBookmarkResponseDTO,
  CreateLikeResponseDTO,
  DeleteLikeResponseDTO,
  PostDetailResponseDTO,
  PostDetailWithAuthorResponseDTO,
  PostResponseDTO
} from '@/presentation/http/express/v1/dtos/post/post.response.dto';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IPostController {
  getNewFeeds(
    req: ExpressRequest<ParamsDictionary, object, object, CursorPaginationQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  getPostDetail(
    req: ExpressRequest<GetPostDetailParamsDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  getPostsType(
    req: ExpressRequest<GetPostsParamsDTO, object, object, CursorPaginationQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  createPost(
    req: ExpressRequest<ParamsDictionary, object, CreatePostRequestDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  patchPost(
    req: ExpressRequest<GetPostDetailParamsDTO, object, PatchPostRequestDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  createBookmark(
    req: ExpressRequest<ParamsDictionary, object, CreateBookmarkRequestDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  deleteBookmark(
    req: ExpressRequest<DeleteBookmarkParamsDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  createLike(
    req: ExpressRequest<ParamsDictionary, object, CreateLikeRequestDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  deleteLike(req: ExpressRequest<DeleteLikeParamsDTO>, res: ExpressResponse, next: NextFunction): Promise<unknown>;
}

export class PostController extends BaseController implements IPostController {
  constructor(
    private readonly getNewFeedsUC: GetNewFeedsPort,
    private readonly getGuestNewFeedsUC: GetGuestNewFeedsPort,
    private readonly getPostDetailUC: GetPostDetailPort,
    private readonly increaseViewsUC: IncreaseViewsPort,
    private readonly getPostsTypeUC: GetPostsTypePort,
    private readonly createPostUC: CreatePostPort,
    private readonly updatePostUC: UpdatePostPort,
    private readonly createBookmarkUC: BookmarkPostPort,
    private readonly unbookmarkPostUC: UnbookmarkPostPort,
    private readonly createLikeUC: CreateLikePort,
    private readonly unlikeUC: UnlikePort
  ) {
    super();
  }

  @AutoBind()
  async getNewFeeds(req: ExpressRequest<ParamsDictionary, object, object, CursorPaginationQueryDTO>) {
    const { cursor, limit } = req.query;
    const userId = this.getUserId(req, { optional: true });

    let items: PostDetailWithAuthorResponseDTO[];
    let nextCursor: string | null;

    if (userId) {
      const results = await this.getNewFeedsUC.execute<PostDetailWithAuthorResponseDTO>({
        userId,
        cursor,
        limit: Number(limit)
      });

      items = results.items;
      nextCursor = results.nextCursor;
    } else {
      const guestResults = await this.getGuestNewFeedsUC.execute<PostDetailWithAuthorResponseDTO>({
        cursor,
        limit: Number(limit)
      });

      items = guestResults.items;
      nextCursor = guestResults.nextCursor;
    }

    return this.cursorPaginatedResponse<PostDetailWithAuthorResponseDTO>({
      items,
      nextCursor,
      message: 'Get new feeds successfully'
    });
  }

  @AutoBind()
  async getPostDetail(req: ExpressRequest<GetPostDetailParamsDTO>) {
    const { postId } = req.params;
    const userId = this.getUserId(req, { optional: true });
    const postDetail = await this.getPostDetailUC.execute(new GetPostDetailQuery({ postId, viewerUserId: userId }));
    const post = new PostDetailResponseDTO(postDetail);

    const updatedViews = await this.increaseViewsUC.execute({ postId, userId });
    if (updatedViews) {
      post.userViews = updatedViews.userViews;
      post.guestViews = updatedViews.guestViews;
      post.updatedAt = updatedViews.updatedAt!;
    }

    return this.response<PostDetailResponseDTO>({
      data: post,
      message: 'Get post detail successfully'
    });
  }

  @AutoBind()
  async getPostsType(req: ExpressRequest<GetPostsParamsDTO, object, object, CursorPaginationQueryDTO>) {
    const { postId, type } = req.params;
    const { cursor, limit } = req.query;
    const userId = this.getUserId(req, { optional: true });

    const { items, nextCursor } = await this.getPostsTypeUC.execute<PostDetailResponseDTO>({
      userId,
      postId,
      type,
      cursor,
      limit: Number(limit)
    });

    return this.cursorPaginatedResponse<PostDetailResponseDTO>({
      items,
      nextCursor,
      message: 'Get posts type successfully'
    });
  }

  @AutoBind()
  async createPost(req: ExpressRequest<ParamsDictionary, object, CreatePostRequestDTO>) {
    const userId = this.getUserId(req);
    const dto = new CreatePostRequestDTO(req.body);

    const post = await this.createPostUC.execute({
      userId,
      type: dto.type,
      parentId: dto.parentId,
      content: dto.content,
      audience: dto.audience,
      allowStrangerComments: dto.allowStrangerComments,
      media: dto.media,
      hashtags: dto.hashtags,
      mentions: dto.mentions
    });

    return this.response<PostResponseDTO>({
      instance: Created,
      data: new PostResponseDTO(post),
      message: 'Create post successfully'
    });
  }

  @AutoBind()
  async patchPost(req: ExpressRequest<GetPostDetailParamsDTO, object, PatchPostRequestDTO>) {
    const userId = this.getUserId(req);
    const { postId } = req.params;
    const dto = new PatchPostRequestDTO(req.body);

    const post = await this.updatePostUC.execute({
      userId,
      postId,
      audience: dto.audience,
      allowStrangerComments: dto.allowStrangerComments,
      content: dto.content,
      media: dto.media,
      hashtags: dto.hashtags,
      mentions: dto.mentions
    });

    return this.response<PostResponseDTO>({
      data: new PostResponseDTO(post),
      message: 'Post updated successfully'
    });
  }

  @AutoBind()
  async createBookmark(req: ExpressRequest<ParamsDictionary, object, CreateBookmarkRequestDTO>) {
    const userId = this.getUserId(req);
    const dto = new CreateBookmarkRequestDTO(req.body);

    const bookmark = await this.createBookmarkUC.execute({
      userId,
      postId: dto.postId
    });

    return this.response<CreateBookmarkResponseDTO>({
      instance: Created,
      data: new CreateBookmarkResponseDTO(bookmark),
      message: 'Bookmark post successfully'
    });
  }

  @AutoBind()
  async deleteBookmark(req: ExpressRequest<DeleteBookmarkParamsDTO>) {
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

  @AutoBind()
  async createLike(req: ExpressRequest<ParamsDictionary, object, CreateLikeRequestDTO>) {
    const userId = this.getUserId(req);
    const dto = new CreateLikeRequestDTO(req.body);

    const like = await this.createLikeUC.execute({
      userId,
      postId: dto.postId
    });

    return this.response<CreateLikeResponseDTO>({
      instance: Created,
      data: new CreateLikeResponseDTO(like),
      message: 'Post liked successfully'
    });
  }

  @AutoBind()
  async deleteLike(req: ExpressRequest<DeleteLikeParamsDTO>) {
    const userId = this.getUserId(req);
    const { postId } = req.params;

    const like = await this.unlikeUC.execute({
      userId,
      postId
    });

    return this.response<DeleteLikeResponseDTO>({
      data: new DeleteLikeResponseDTO(like),
      message: 'Like removed successfully'
    });
  }
}
