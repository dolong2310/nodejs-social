import { TokenPayload } from '@/interfaces';
import { IUser, PostDetailResponseDTO } from '@/modules';
import 'express';
import type { Logger } from 'pino';

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
