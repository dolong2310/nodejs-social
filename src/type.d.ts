import { IPostDetailResponse } from '@/models/responses/post.response';
import { IPost } from '@/models/schemas/post.schema';
import { IUser } from '@/models/schemas/user.schema';
import {
  AccessTokenPayload,
  EmailVerificationTokenPayload,
  ForgotPasswordTokenPayload,
  RefreshTokenPayload
} from '@/types/token.type';
import 'express';

declare module 'express' {
  interface Request {
    user?: IUser;
    post?: IPost;
    postDetail?: IPostDetailResponse;
    accessTokenPayload?: AccessTokenPayload;
    refreshTokenPayload?: RefreshTokenPayload;
    emailVerificationTokenPayload?: EmailVerificationTokenPayload;
    forgotPasswordTokenPayload?: ForgotPasswordTokenPayload;
  }
}
