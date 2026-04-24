import { CreatePostInPort } from '@/application/use-cases/post/create-post/create-post.in-port';
import { GetGuestNewFeedsInPort } from '@/application/use-cases/post/get-guest-new-feeds/get-guest-new-feeds.in-port';
import { GetNewFeedsInPort } from '@/application/use-cases/post/get-new-feeds/get-new-feeds.in-port';
import { GetPostsTypeInPort } from '@/application/use-cases/post/get-posts-type/get-posts-type.in-port';
import { IncreaseViewsInPort } from '@/application/use-cases/post/increase-views/increase-views.in-port';
import { UpdatePostInPort } from '@/application/use-cases/post/update-post/update-post.in-port';
import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { CursorPaginationQueryDTO } from '@/presentation/http/dtos/common/common.request.dto';
import {
  CreatePostRequestDTO,
  GetPostDetailParamsDTO,
  GetPostsParamsDTO,
  PatchPostRequestDTO
} from '@/presentation/http/dtos/post/post.request.dto';
import {
  PostDetailResponseDTO,
  PostDetailWithAuthorResponseDTO,
  PostResponseDTO
} from '@/presentation/http/dtos/post/post.response.dto';
import { Created } from '@/presentation/http/responses/success.response';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IPostController {
  getNewFeeds(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response): Promise<void>;
  getPostDetail(req: Request<GetPostDetailParamsDTO>, res: Response): Promise<void>;
  getPostsType(req: Request<GetPostsParamsDTO, object, object, CursorPaginationQueryDTO>, res: Response): Promise<void>;
  createPost(req: Request<ParamsDictionary, object, CreatePostRequestDTO>, res: Response): Promise<void>;
  patchPost(req: Request<GetPostDetailParamsDTO, object, PatchPostRequestDTO>, res: Response): Promise<void>;
}

export class PostController extends BaseController implements IPostController {
  constructor(
    private readonly getNewFeedsUC: GetNewFeedsInPort,
    private readonly getGuestNewFeedsUC: GetGuestNewFeedsInPort,
    private readonly increaseViewsUC: IncreaseViewsInPort,
    private readonly getPostsTypeUC: GetPostsTypeInPort,
    private readonly createPostUC: CreatePostInPort,
    private readonly updatePostUC: UpdatePostInPort
  ) {
    super();
  }

  @AutoBind()
  async getNewFeeds(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
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

    this.sendCursorPaginatedResponse<PostDetailWithAuthorResponseDTO>({
      res,
      items,
      nextCursor,
      message: 'Get new feeds successfully'
    });
  }

  @AutoBind()
  async getPostDetail(req: Request<GetPostDetailParamsDTO>, res: Response) {
    const { postId } = req.params;
    const userId = this.getUserId(req, { optional: true });
    const post = req.postDetail as PostDetailResponseDTO; // TODO: use use case to get post detail

    const updatedViews = await this.increaseViewsUC.execute({ postId, userId });
    if (updatedViews) {
      post.userViews = updatedViews.userViews;
      post.guestViews = updatedViews.guestViews;
      post.updatedAt = updatedViews.updatedAt!;
    }

    this.sendResponse<PostDetailResponseDTO>({
      res,
      data: post,
      message: 'Get post detail successfully'
    });
  }

  @AutoBind()
  async getPostsType(req: Request<GetPostsParamsDTO, object, object, CursorPaginationQueryDTO>, res: Response) {
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

    this.sendCursorPaginatedResponse<PostDetailResponseDTO>({
      res,
      items,
      nextCursor,
      message: 'Get posts type successfully'
    });
  }

  @AutoBind()
  async createPost(req: Request<ParamsDictionary, object, CreatePostRequestDTO>, res: Response) {
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

    this.sendResponse<PostResponseDTO>({
      res,
      instance: Created,
      data: new PostResponseDTO(post),
      message: 'Create post successfully'
    });
  }

  @AutoBind()
  async patchPost(req: Request<GetPostDetailParamsDTO, object, PatchPostRequestDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { postId } = req.params;
    const dto = new PatchPostRequestDTO(req.body);

    const post = await this.updatePostUC.execute({
      userId,
      postId,
      audience: dto.audience,
      allowStrangerComments: dto.allowStrangerComments
    });

    this.sendResponse<PostResponseDTO>({
      res,
      data: new PostResponseDTO(post),
      message: 'Post updated successfully'
    });
  }
}
