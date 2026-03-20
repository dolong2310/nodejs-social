import { PostDetailResponseDTO } from '@/dtos/responses/post.response.dto';
import { IUser } from '@/models/schemas/user.schema';
import { TokenPayload } from '@/types/token.type';
import 'express';

declare module 'express' {
  interface Request {
    user?: IUser;
    postDetail?: PostDetailResponseDTO;
    tokenPayload?: TokenPayload;
  }
}
