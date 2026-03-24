import { BaseController } from '@/controllers/base.controller';
import { PaginationQueryDTO } from '@/dtos/requests/common.request.dto';
import {
  CreatePostRequestDTO,
  GetPostDetailParamsDTO,
  GetPostsParamsDTO,
  PatchPostRequestDTO
} from '@/dtos/requests/post.request.dto';
import { PostDetailResponseDTO, PostNewFeedResponseDTO } from '@/dtos/responses/post.response.dto';
import { IPost } from '@/models/post.schema';
import { Created } from '@/responses/success.response';
import { IFriendsService } from '@/services/friends.service';
import { IPostsService } from '@/services/posts.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IPostsController {
  getNewFeeds(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response): Promise<void>;
  getPostDetail(req: Request<GetPostDetailParamsDTO>, res: Response): Promise<void>;
  getPostsType(req: Request<GetPostsParamsDTO, object, object, PaginationQueryDTO>, res: Response): Promise<void>;
  createPost(req: Request<ParamsDictionary, object, CreatePostRequestDTO>, res: Response): Promise<void>;
  patchPost(req: Request<GetPostDetailParamsDTO, object, PatchPostRequestDTO>, res: Response): Promise<void>;
}

class PostsController extends BaseController implements IPostsController {
  constructor(
    private readonly postsService: IPostsService,
    private readonly friendsService: IFriendsService
  ) {
    super();
  }

  getNewFeeds = async (req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response) => {
    const { page, limit } = req.query;
    const userId = this.getUserId(req, { optional: true });

    let posts: PostNewFeedResponseDTO[];
    let totalPosts: number;

    if (userId) {
      // Same DTO field name as before; values are mutual friend ids from friendships collection.
      const friendUserIds = await this.friendsService.findFriendUserIds(userId);

      const results = await this.postsService.getNewFeeds({
        userId,
        friendUserIds,
        page,
        limit
      });

      posts = results.posts;
      totalPosts = results.totalPosts;
    } else {
      const guestResults = await this.postsService.getGuestNewFeeds({
        page,
        limit
      });

      posts = guestResults.posts;
      totalPosts = guestResults.totalPosts;
    }

    this.sendPaginatedResponse<PostNewFeedResponseDTO[]>({
      res,
      data: posts,
      pagination: {
        page,
        limit,
        totalItems: totalPosts
      },
      message: 'Get new feeds successfully'
    });
  };

  getPostDetail = async (req: Request<GetPostDetailParamsDTO>, res: Response) => {
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
  };

  getPostsType = async (req: Request<GetPostsParamsDTO, object, object, PaginationQueryDTO>, res: Response) => {
    const { postId, type } = req.params;
    const { page, limit } = req.query;
    const userId = this.getUserId(req, { optional: true });

    const { posts, totalPosts } = await this.postsService.getPostsType({
      userId,
      postId,
      type,
      page,
      limit
    });

    this.sendPaginatedResponse<PostDetailResponseDTO[]>({
      res,
      data: posts,
      pagination: {
        page,
        limit,
        totalItems: totalPosts
      },
      message: 'Get posts type successfully'
    });
  };

  createPost = async (req: Request<ParamsDictionary, object, CreatePostRequestDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const dto = new CreatePostRequestDTO(req.body);

    const post = await this.postsService.createPost({
      userId,
      body: dto
    });

    this.sendResponse<IPost>({
      res,
      instance: Created,
      data: post,
      message: 'Create post successfully'
    });
  };

  patchPost = async (req: Request<GetPostDetailParamsDTO, object, PatchPostRequestDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { postId } = req.params;
    const dto = new PatchPostRequestDTO(req.body);

    const post = await this.postsService.patchPostByOwner({
      userId,
      postId,
      body: dto
    });

    this.sendResponse<IPost>({
      res,
      data: post,
      message: 'Post updated successfully'
    });
  };
}

export default PostsController;
