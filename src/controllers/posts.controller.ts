import { BaseController } from '@/controllers/base.controller';
import { IPaginationRequestQuery } from '@/models/requests/common.request';
import {
  ICreatePostRequestBody,
  IGetPostDetailRequestParams,
  IGetPostsRequestParams
} from '@/models/requests/post.request';
import { IPostDetailResponse, IPostNewFeedResponse } from '@/models/responses/post.response';
import { IPost } from '@/models/schemas/post.schema';
import { Created } from '@/responses/success.response';
import { IFollowersService } from '@/services/followers.service';
import { IPostsService } from '@/services/posts.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IPostsController {
  getNewFeeds(req: Request<ParamsDictionary, object, object, IPaginationRequestQuery>, res: Response): Promise<void>;
  getPostDetail(req: Request<IGetPostDetailRequestParams>, res: Response): Promise<void>;
  getPostsType(
    req: Request<IGetPostsRequestParams, object, object, IPaginationRequestQuery>,
    res: Response
  ): Promise<void>;
  createPost(req: Request<ParamsDictionary, object, ICreatePostRequestBody>, res: Response): Promise<void>;
}

class PostsController extends BaseController implements IPostsController {
  constructor(
    private readonly postsService: IPostsService,
    private readonly followersService: IFollowersService
  ) {
    super();
  }

  getNewFeeds = async (req: Request<ParamsDictionary, object, object, IPaginationRequestQuery>, res: Response) => {
    const { page, limit } = req.query;
    const userId = this.getUserId(req, { optional: true });

    let posts: IPostNewFeedResponse[];
    let totalPosts: number;

    if (userId) {
      const followedUserIds = await this.followersService.findFollowedUserIds(userId);

      const results = await this.postsService.getNewFeeds({
        userId,
        followedUserIds,
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

    this.sendPaginatedResponse<IPostNewFeedResponse[]>({
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

  getPostDetail = async (req: Request<IGetPostDetailRequestParams>, res: Response) => {
    const { postId } = req.params;
    const userId = this.getUserId(req);
    const post = req.postDetail as IPostDetailResponse;

    const updatedViews = await this.postsService.increaseViews({ postId, userId });
    if (updatedViews) {
      post.userViews = updatedViews.userViews;
      post.guestViews = updatedViews.guestViews;
      post.updatedAt = updatedViews.updatedAt;
    }

    this.sendResponse<IPostDetailResponse>({
      res,
      data: post,
      message: 'Get post detail successfully'
    });
  };

  getPostsType = async (
    req: Request<IGetPostsRequestParams, object, object, IPaginationRequestQuery>,
    res: Response
  ) => {
    const { postId, type } = req.params;
    const { page, limit } = req.query;
    const userId = this.getUserId(req);

    const { posts, totalPosts } = await this.postsService.getPostsType({
      userId,
      postId,
      type,
      page,
      limit
    });

    this.sendPaginatedResponse<IPostDetailResponse[]>({
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

  createPost = async (req: Request<ParamsDictionary, object, ICreatePostRequestBody>, res: Response) => {
    const userId = this.getUserId(req);
    const { type, audience, content, parentId, hashtags, mentions, media } = req.body;

    const post = await this.postsService.createPost({
      userId,
      body: { type, audience, content, parentId, hashtags, mentions, media }
    });

    this.sendResponse<IPost>({
      res,
      instance: Created,
      data: post,
      message: 'Create post successfully'
    });
  };
}

export default PostsController;
