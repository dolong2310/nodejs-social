import { BaseController } from '@/controllers/base.controller';
import { IPaginationRequestQuery } from '@/models/requests/common.request';
import {
  ICreatePostRequestBody,
  IGetPostDetailRequestParams,
  IGetPostsRequestParams
} from '@/models/requests/post.request';
import { IPostDetailResponse, IPostNewFeedResponse } from '@/models/responses/post.response';
import { Created, OK } from '@/responses/success.response';
import { IFollowersService } from '@/services/followers.service';
import { IPostsService } from '@/services/posts.service';
import { TokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

export interface IPostsController {
  getNewFeeds(req: Request<{}, {}, {}, IPaginationRequestQuery>, res: Response): Promise<void>;
  getPostDetail(req: Request<IGetPostDetailRequestParams>, res: Response): Promise<void>;
  getPostsType(req: Request<IGetPostsRequestParams, {}, {}, IPaginationRequestQuery>, res: Response): Promise<void>;
  createPost(req: Request<{}, {}, ICreatePostRequestBody>, res: Response): Promise<void>;
}

class PostsController extends BaseController implements IPostsController {
  constructor(
    private readonly postsService: IPostsService,
    private readonly followersService: IFollowersService
  ) {
    super();
  }

  async getNewFeeds(req: Request<{}, {}, {}, IPaginationRequestQuery>, res: Response) {
    const { page, limit } = req.query;
    const userId = req.tokenPayload?.userId;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    let posts: IPostNewFeedResponse[] = [];
    let totalPosts = 0;

    if (userId) {
      const followedUserIds = await this.followersService.findFollowedUserIds(userId);

      const results = await this.postsService.getNewFeeds({
        userId,
        followedUserIds,
        page: pageNumber,
        limit: limitNumber
      });

      posts = results.posts;
      totalPosts = results.totalPosts;
    } else {
      const guestResults = await this.postsService.getGuestNewFeeds({
        page: pageNumber,
        limit: limitNumber
      });

      posts = guestResults.posts;
      totalPosts = guestResults.totalPosts;
    }

    new OK({
      data: {
        posts,
        page: pageNumber,
        limit: limitNumber,
        totalItems: totalPosts,
        totalPages: Math.ceil(totalPosts / limitNumber)
      },
      message: 'Get new feeds successfully'
    }).send(res);
  }

  async getPostDetail(req: Request<IGetPostDetailRequestParams>, res: Response) {
    const { postId } = req.params;
    const userId = req.tokenPayload?.userId;
    const post = req.postDetail as IPostDetailResponse;

    const updatedViews = await this.postsService.increaseViews({ postId, userId });
    if (updatedViews) {
      post.userViews = updatedViews.userViews;
      post.guestViews = updatedViews.guestViews;
      post.updatedAt = updatedViews.updatedAt;
    }

    new OK({
      data: post,
      message: 'Get post detail successfully'
    }).send(res);
  }

  async getPostsType(req: Request<IGetPostsRequestParams, {}, {}, IPaginationRequestQuery>, res: Response) {
    const { postId, type } = req.params;
    const { page, limit } = req.query;
    const userId = req.tokenPayload?.userId;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const { posts, totalPosts } = await this.postsService.getPostsType({
      userId,
      postId,
      type,
      page: pageNumber,
      limit: limitNumber
    });

    new OK({
      data: {
        posts,
        page: pageNumber,
        limit: limitNumber,
        totalItems: totalPosts,
        totalPages: Math.ceil(totalPosts / limitNumber)
      },
      message: 'Get posts type successfully'
    }).send(res);
  }

  async createPost(req: Request<{}, {}, ICreatePostRequestBody>, res: Response) {
    const { userId } = req.tokenPayload as TokenPayload;
    const { type, audience, content, parentId, hashtags, mentions, media } = req.body;

    const post = await this.postsService.createPost({
      userId,
      body: { type, audience, content, parentId, hashtags, mentions, media }
    });

    new Created({
      data: post,
      message: 'Create post successfully'
    }).send(res);
  }
}

export default PostsController;
