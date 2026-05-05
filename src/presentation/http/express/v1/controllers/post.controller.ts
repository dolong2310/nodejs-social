import { CreatePostInPort } from '@/modules/post/application/use-cases/create-post/create-post.in-port';
import { GetGuestNewFeedsInPort } from '@/modules/post/application/use-cases/get-guest-new-feeds/get-guest-new-feeds.in-port';
import { GetNewFeedsInPort } from '@/modules/post/application/use-cases/get-new-feeds/get-new-feeds.in-port';
import {
  GetPostDetailInPort,
  GetPostDetailQuery
} from '@/modules/post/application/use-cases/get-post-detail/get-post-detail.in-port';
import { GetPostsTypeInPort } from '@/modules/post/application/use-cases/get-posts-type/get-posts-type.in-port';
import { IncreaseViewsInPort } from '@/modules/post/application/use-cases/increase-views/increase-views.in-port';
import { UpdatePostInPort } from '@/modules/post/application/use-cases/update-post/update-post.in-port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
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
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IPostController {
  getNewFeeds(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>): Promise<unknown>;
  getPostDetail(req: Request<GetPostDetailParamsDTO>): Promise<unknown>;
  getPostsType(req: Request<GetPostsParamsDTO, object, object, CursorPaginationQueryDTO>): Promise<unknown>;
  createPost(req: Request<ParamsDictionary, object, CreatePostRequestDTO>): Promise<unknown>;
  patchPost(req: Request<GetPostDetailParamsDTO, object, PatchPostRequestDTO>): Promise<unknown>;
}

export class PostController extends BaseController implements IPostController {
  constructor(
    private readonly getNewFeedsUC: GetNewFeedsInPort,
    private readonly getGuestNewFeedsUC: GetGuestNewFeedsInPort,
    private readonly getPostDetailUC: GetPostDetailInPort,
    private readonly increaseViewsUC: IncreaseViewsInPort,
    private readonly getPostsTypeUC: GetPostsTypeInPort,
    private readonly createPostUC: CreatePostInPort,
    private readonly updatePostUC: UpdatePostInPort
  ) {
    super();
  }

  @AutoBind()
  async getNewFeeds(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>) {
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
  async getPostDetail(req: Request<GetPostDetailParamsDTO>) {
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
  async getPostsType(req: Request<GetPostsParamsDTO, object, object, CursorPaginationQueryDTO>) {
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
  async createPost(req: Request<ParamsDictionary, object, CreatePostRequestDTO>) {
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
  async patchPost(req: Request<GetPostDetailParamsDTO, object, PatchPostRequestDTO>) {
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
