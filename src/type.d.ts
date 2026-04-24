import { PostDetailResponseDTO } from '@/application/dtos/post/post.result.dto';
import { AccessTokenPayload } from '@/application/services/token/token.service.type';
import { UserSafeProps } from '@/domain/entities/user/user.type';
import { REFRESH_TOKEN_COOKIE_NAME } from '@/presentation/http/constants/auth.constant';
import 'express';
import type { Logger } from 'pino';

declare module 'express' {
  interface Request {
    user?: UserSafeProps;
    postDetail?: PostDetailResponseDTO;
    tokenPayload?: AccessTokenPayload;
    [REFRESH_TOKEN_COOKIE_NAME]?: string;
    log: Logger;
  }

  interface Response {
    log: Logger;
  }
}
