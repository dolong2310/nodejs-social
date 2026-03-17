import { IPaginationRequestQuery } from '@/models/requests/common.request';
import {
  ICreatePostRequestBody,
  IGetPostDetailRequestParams,
  IGetPostsRequestParams
} from '@/models/requests/post.request';
import { IPostDetailResponse, IPostNewFeedResponse } from '@/models/responses/post.response';
import { Created, OK } from '@/models/success.response';
import followersService from '@/services/followers.service';
import postsService from '@/services/posts.service';
import { AccessTokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

class PostsController {
  constructor() {}

  async getNewFeeds(req: Request<{}, {}, {}, IPaginationRequestQuery>, res: Response) {
    const { page, limit } = req.query;
    const userId = req.accessTokenPayload?.userId;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    let posts: IPostNewFeedResponse[] = [];
    let totalPosts = 0;

    if (userId) {
      const followedUserIds = await followersService.findFollowedUserIds(userId);

      const results = await postsService.getNewFeeds({
        userId,
        followedUserIds,
        page: pageNumber,
        limit: limitNumber
      });

      posts = results.posts;
      totalPosts = results.totalPosts;
    } else {
      const guestResults = await postsService.getGuestNewFeeds({
        page: pageNumber,
        limit: limitNumber
      });

      posts = guestResults.posts;
      totalPosts = guestResults.totalPosts;
    }

    return new OK({
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
    const userId = req.accessTokenPayload?.userId;
    const post = req.postDetail as IPostDetailResponse;

    const updatedViews = await postsService.increaseViews({ postId, userId });
    if (updatedViews) {
      post.userViews = updatedViews.userViews;
      post.guestViews = updatedViews.guestViews;
      post.updatedAt = updatedViews.updatedAt;
    }

    return new OK({
      data: post,
      message: 'Get post detail successfully'
    }).send(res);
  }

  async getPostsType(req: Request<IGetPostsRequestParams, {}, {}, IPaginationRequestQuery>, res: Response) {
    const { postId, type } = req.params;
    const { page, limit } = req.query;
    const userId = req.accessTokenPayload?.userId;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const { posts, totalPosts } = await postsService.getPostsType({
      userId,
      postId,
      type,
      page: pageNumber,
      limit: limitNumber
    });

    return new OK({
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
    const { userId } = req.accessTokenPayload as AccessTokenPayload;
    const { type, audience, content, parentId, hashtags, mentions, media } = req.body;

    const post = await postsService.createPost({
      userId,
      body: { type, audience, content, parentId, hashtags, mentions, media }
    });

    return new Created({
      data: post,
      message: 'Create post successfully'
    }).send(res);
  }
}

export default new PostsController();
