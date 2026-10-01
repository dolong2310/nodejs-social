import { AccessTokenPayload } from '@/modules/authentication/application/services/token.service.types';
import { RoleWithPermissions } from '@/modules/authorization/domain/repositories/role.query.types';
import { UserSafeProps } from '@/modules/user/domain/entities/user.types';
import { REFRESH_TOKEN_COOKIE_NAME } from '@/presentation/http/express/constants/auth.constants';
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
