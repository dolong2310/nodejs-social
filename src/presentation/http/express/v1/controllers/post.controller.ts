import { CreatePostPort } from '@/modules/post/application/use-cases/create-post/create-post.port';
import { GetGuestNewFeedsPort } from '@/modules/post/application/use-cases/get-guest-new-feeds/get-guest-new-feeds.port';
import { GetNewFeedsPort } from '@/modules/post/application/use-cases/get-new-feeds/get-new-feeds.port';
import {
  GetPostDetailPort,
  GetPostDetailQuery
} from '@/modules/post/application/use-cases/get-post-detail/get-post-detail.port';
import { GetPostsTypePort } from '@/modules/post/application/use-cases/get-posts-type/get-posts-type.port';
import { IncreaseViewsPort } from '@/modules/post/application/use-cases/increase-views/increase-views.port';
import { UpdatePostPort } from '@/modules/post/application/use-cases/update-post/update-post.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { CursorPaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import {
  CreatePostRequestDTO,
  GetPostDetailParamsDTO,
  GetPostsParamsDTO,
  PatchPostRequestDTO
} from '@/presentation/http/express/v1/dtos/post/post.request.dto';
import {
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
}

export class PostController extends BaseController implements IPostController {
  constructor(
    private readonly getNewFeedsUC: GetNewFeedsPort,
    private readonly getGuestNewFeedsUC: GetGuestNewFeedsPort,
    private readonly getPostDetailUC: GetPostDetailPort,
    private readonly increaseViewsUC: IncreaseViewsPort,
    private readonly getPostsTypeUC: GetPostsTypePort,
    private readonly createPostUC: CreatePostPort,
    private readonly updatePostUC: UpdatePostPort
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
      allowStrangerComments: dto.allowStrangerComments
    });

    return this.response<PostResponseDTO>({
      data: new PostResponseDTO(post),
      message: 'Post updated successfully'
    });
  }
}
