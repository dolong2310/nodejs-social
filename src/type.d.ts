import { AccessTokenPayload } from '@/modules/auth/application/services/token.service.type';
import { RoleWithPermissions } from '@/modules/role/application/ports/queries/role-query.type';
import { UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { REFRESH_TOKEN_COOKIE_NAME } from '@/presentation/http/express/constants/auth.constant';
import 'express';
import type { Logger } from 'pino';

declare module 'express' {
  interface Request {
    user?: UserSafeProps;
    tokenPayload?: AccessTokenPayload;
    [REFRESH_TOKEN_COOKIE_NAME]?: string;
    role?: RoleWithPermissions;
    log: Logger;
  }

  interface Response {
    log: Logger;
  }
}
