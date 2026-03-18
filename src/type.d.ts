import { IPostDetailResponse } from '@/models/responses/post.response';
import { IPost } from '@/models/schemas/post.schema';
import { IUser } from '@/models/schemas/user.schema';
import { TokenPayload } from '@/types/token.type';
import 'express';

declare module 'express' {
  interface Request {
    user?: IUser;
    post?: IPost;
    postDetail?: IPostDetailResponse;
    tokenPayload?: TokenPayload;
  }
}
