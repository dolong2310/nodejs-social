import { TokenPayload } from '@/domain/value-objects/token.value-object';

import { PostDetailResponseDTO } from '@/application/dtos/post/post.result.dto';
import { UserResultDTO } from '@/application/dtos/user/user.result.dto';

import 'express';
import type { Logger } from 'pino';

declare module 'express' {
  interface Request {
    user?: UserResultDTO;
    postDetail?: PostDetailResponseDTO;
    tokenPayload?: TokenPayload;
    refreshTokenJwt?: string; // Raw refresh JWT from httpOnly cookie (set by refresh-token / logout cookie validation).
    log: Logger;
  }

  interface Response {
    log: Logger;
  }
}
