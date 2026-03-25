import { PostDetailResponseDTO } from '@/dtos/responses/post.response.dto';
import { IUser } from '@/models/user.schema';
import { TokenPayload } from '@/types/token.type';
import type { Logger } from 'pino';
import 'express';

declare module 'express' {
  interface Request {
    user?: IUser;
    postDetail?: PostDetailResponseDTO;
    tokenPayload?: TokenPayload;
    /** Raw refresh JWT from httpOnly cookie (set by refresh-token / logout cookie validation). */
    refreshTokenJwt?: string;
    log: Logger;
  }

  interface Response {
    log: Logger;
  }
}
