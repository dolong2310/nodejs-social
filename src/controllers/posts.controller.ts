import HTTP_STATUS from '@/constants/httpStatus.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ErrorWithStatus } from '@/models/error.model';
import { ICreatePostRequestBody, IGetPostDetailRequestParams } from '@/models/requests/post.request';
import { IPostDetailResponse } from '@/models/responses/post.response';
import postsService from '@/services/posts.service';
import { AccessTokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

class PostsController {
  constructor() {}

  // getPosts(req: Request, res: Response) {}

  async getPostDetail(req: Request<IGetPostDetailRequestParams>, res: Response) {
    const { postId } = req.params;
    const userId = req.accessTokenPayload?.userId;
    const post = req.postDetail as IPostDetailResponse;

    const updatedViews = await postsService.increaseViews({ postId, userId });
    if (updatedViews) {
      post.userViews = updatedViews.userViews;
      post.guestViews = updatedViews.guestViews;
    }

    return res.status(HTTP_STATUS.OK).json({
      data: post,
      message: 'Post detail fetched successfully'
    });
  }

  async createPost(req: Request<{}, {}, ICreatePostRequestBody>, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;
    const { type, audience, content, parentId, hashtags, mentions, media } = req.body;

    const post = await postsService.createPost({
      userId,
      body: { type, audience, content, parentId, hashtags, mentions, media }
    });

    return res.status(HTTP_STATUS.CREATED).json({
      data: post,
      message: 'Post created successfully'
    });
  }
}

export default new PostsController();
