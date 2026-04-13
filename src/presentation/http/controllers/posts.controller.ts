import { IPostsService } from '@/application/ports/post.port';

import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { CursorPaginationQueryDTO } from '@/presentation/http/dtos/common/common.request.dto';
import {
  CreatePostRequestDTO,
  GetPostDetailParamsDTO,
  GetPostsParamsDTO,
  PatchPostRequestDTO
} from '@/presentation/http/dtos/post/posts.request.dto';
import {
  PostDetailResponseDTO,
  PostNewFeedResponseDTO,
  PostResponseDTO
} from '@/presentation/http/dtos/post/posts.response.dto';
import { Created } from '@/presentation/http/responses/success.response';

import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IPostsController {
  getNewFeeds(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response): Promise<void>;
  getPostDetail(req: Request<GetPostDetailParamsDTO>, res: Response): Promise<void>;
  getPostsType(req: Request<GetPostsParamsDTO, object, object, CursorPaginationQueryDTO>, res: Response): Promise<void>;
  createPost(req: Request<ParamsDictionary, object, CreatePostRequestDTO>, res: Response): Promise<void>;
  patchPost(req: Request<GetPostDetailParamsDTO, object, PatchPostRequestDTO>, res: Response): Promise<void>;
}

export class PostsController extends BaseController implements IPostsController {
  constructor(private readonly postsService: IPostsService) {
    super();
  }

  @AutoBind()
  async getNewFeeds(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
    const { cursor, limit } = req.query;
    const userId = this.getUserId(req, { optional: true });

    let posts: PostNewFeedResponseDTO[];
    let nextCursor: string | null;

    if (userId) {
      const results = await this.postsService.getNewFeeds({
        userId,
        cursor,
        limit: Number(limit)
      });

      posts = results.items;
      nextCursor = results.nextCursor;
    } else {
      const guestResults = await this.postsService.getGuestNewFeeds({
        cursor,
        limit: Number(limit)
      });

      posts = guestResults.items;
      nextCursor = guestResults.nextCursor;
    }

    this.sendCursorPaginatedResponse<PostNewFeedResponseDTO>({
      res,
      items: posts,
      nextCursor,
      message: 'Get new feeds successfully'
    });
  }

  @AutoBind()
  async getPostDetail(req: Request<GetPostDetailParamsDTO>, res: Response) {
    const { postId } = req.params;
    const userId = this.getUserId(req, { optional: true });
    const post = req.postDetail as PostDetailResponseDTO;

    const updatedViews = await this.postsService.increaseViews({ postId, userId });
    if (updatedViews) {
      post.userViews = updatedViews.userViews;
      post.guestViews = updatedViews.guestViews;
      post.updatedAt = updatedViews.updatedAt;
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

    const { items, nextCursor } = await this.postsService.getPostsType({
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

    const post = await this.postsService.createPost({
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
      data: post,
      message: 'Create post successfully'
    });
  }

  @AutoBind()
  async patchPost(req: Request<GetPostDetailParamsDTO, object, PatchPostRequestDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { postId } = req.params;
    const dto = new PatchPostRequestDTO(req.body);

    const post = await this.postsService.patchPost({
      userId,
      postId,
      audience: dto.audience,
      allowStrangerComments: dto.allowStrangerComments
    });

    this.sendResponse<PostResponseDTO>({
      res,
      data: post,
      message: 'Post updated successfully'
    });
  }
}
