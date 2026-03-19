import { IPostDetailResponse } from '@/models/responses/post.response';
import { IUser } from '@/models/schemas/user.schema';
import { TokenPayload } from '@/types/token.type';
import 'express';

declare module 'express' {
  interface Request {
    user?: IUser;
    postDetail?: IPostDetailResponse;
    tokenPayload?: TokenPayload;
  }
}
