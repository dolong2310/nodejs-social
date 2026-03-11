import HTTP_STATUS from '@/constants/httpStatus.constant';
import { ICreatePostRequestBody } from '@/models/requests/post.request';
import postsService from '@/services/posts.service';
import { AccessTokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

class PostsController {
  constructor() {}

  getPosts(req: Request, res: Response) {}

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
