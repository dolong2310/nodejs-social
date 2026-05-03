import { AdminGuard } from '@/presentation/http/express/guards/admin.guard';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { IPermissionController } from '@/presentation/http/express/v1/controllers/permission.controller';
import type { IRoleController } from '@/presentation/http/express/v1/controllers/role.controller';
import { AuthRoute } from '@/presentation/http/express/v1/routes/auth.route';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { BlockRoute } from '@/presentation/http/express/v1/routes/block.route';
import { BookmarkRoute } from '@/presentation/http/express/v1/routes/bookmark.route';
import { ConversationRoute } from '@/presentation/http/express/v1/routes/conversation.route';
import { FriendRoute } from '@/presentation/http/express/v1/routes/friend.route';
import { LikeRoute } from '@/presentation/http/express/v1/routes/like.route';
import { MediaRoute } from '@/presentation/http/express/v1/routes/media.route';
import { NotificationRoute } from '@/presentation/http/express/v1/routes/notification.route';
import { OAuthRoute } from '@/presentation/http/express/v1/routes/oauth.route';
import { PermissionRoute } from '@/presentation/http/express/v1/routes/permission.route';
import { PostRoute } from '@/presentation/http/express/v1/routes/post.route';
import { RoleRoute } from '@/presentation/http/express/v1/routes/role.route';
import { SearchRoute } from '@/presentation/http/express/v1/routes/search.route';
import { StaticRoute } from '@/presentation/http/express/v1/routes/static.route';
import { UserRoute } from '@/presentation/http/express/v1/routes/user.route';
import type { IAuthValidator } from '@/presentation/http/express/v1/validators/auth.validator';
import type { IBlockValidator } from '@/presentation/http/express/v1/validators/block.validator';
import type { IChatMessageValidator } from '@/presentation/http/express/v1/validators/chat-message.validator';
import type { IConversationValidator } from '@/presentation/http/express/v1/validators/conversation.validator';
import type { IFriendValidator } from '@/presentation/http/express/v1/validators/friend.validator';
import type { INotificationValidator } from '@/presentation/http/express/v1/validators/notification.validator';
import type { IPermissionsValidator } from '@/presentation/http/express/v1/validators/permission.validator';
import type { IPostValidator } from '@/presentation/http/express/v1/validators/post.validator';
import type { IRolesValidator } from '@/presentation/http/express/v1/validators/role.validator';
import type { ISearchValidator } from '@/presentation/http/express/v1/validators/search.validator';
import type { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';
import type { RequestHandler } from 'express';

/** Middleware rỗng: chỉ gọi `next()` — dùng khi cần object validator/controller giả cho Express đăng ký route, không thực thi logic. */
const nextOnlyMiddleware: RequestHandler = (_request, _response, next) => {
  next();
};

/**
 * Tạo proxy giả: mỗi field là `nextOnlyMiddleware`, hoặc factory trả về nó (userId / postId).
 * Chỉ phục vụ bước khai báo route trong constructor — không dùng xử lý request thật.
 */
function createNoopValidatorProxyForRouteRegistration<T extends object>(): T {
  return new Proxy({} as T, {
    get(_target, propertyKey: string | symbol) {
      if (
        propertyKey === 'userIdValidator' ||
        propertyKey === 'postIdValidator' ||
        propertyKey === 'roleIdParam' ||
        propertyKey === 'createBodyValidator' ||
        propertyKey === 'updateBodyValidator' ||
        propertyKey === 'permissionIdParam'
      ) {
        return () => nextOnlyMiddleware;
      }
      return nextOnlyMiddleware;
    }
  });
}

/**
 * Tạo proxy controller giả: mỗi method trả về hàm async rỗng (đủ cho `asyncHandler` gắn route).
 */
function createNoopControllerProxyForRouteRegistration<T extends object>(): T {
  return new Proxy({} as T, {
    get() {
      return async () => {};
    }
  });
}

const noopAuthGuard = new Proxy({} as AuthGuard, { get: () => nextOnlyMiddleware });
const noopAuthOptionGuard = new Proxy({} as AuthOptionGuard, { get: () => nextOnlyMiddleware });
const noopAdminGuard = new Proxy({} as AdminGuard, { get: () => nextOnlyMiddleware });
const noopThrottlerGuard = new Proxy({} as ThrottlerProxyGuard, { get: () => nextOnlyMiddleware });

/**
 * Thứ tự giống `buildHttpRouters` để danh sách route trùng runtime.
 */
export function buildStubHttpRouters(): BaseRoute[] {
  const authValidator: IAuthValidator = createNoopValidatorProxyForRouteRegistration();
  const userValidator: IUserValidator = createNoopValidatorProxyForRouteRegistration();
  const postValidator: IPostValidator = createNoopValidatorProxyForRouteRegistration();
  const searchValidator: ISearchValidator = createNoopValidatorProxyForRouteRegistration();
  const friendValidator: IFriendValidator = createNoopValidatorProxyForRouteRegistration();
  const blocksValidator: IBlockValidator = createNoopValidatorProxyForRouteRegistration();
  const conversationValidator: IConversationValidator = createNoopValidatorProxyForRouteRegistration();
  const chatMessageValidator: IChatMessageValidator = createNoopValidatorProxyForRouteRegistration();
  const notificationValidator: INotificationValidator = createNoopValidatorProxyForRouteRegistration();
  const rolesValidator: IRolesValidator = createNoopValidatorProxyForRouteRegistration();
  const permissionsValidator: IPermissionsValidator = createNoopValidatorProxyForRouteRegistration();

  return [
    new AuthRoute(createNoopControllerProxyForRouteRegistration(), authValidator, noopAuthGuard, noopThrottlerGuard),
    new UserRoute(
      createNoopControllerProxyForRouteRegistration(),
      userValidator,
      noopAuthGuard,
      noopAuthOptionGuard,
      noopThrottlerGuard
    ),
    new BookmarkRoute(
      createNoopControllerProxyForRouteRegistration(),
      userValidator,
      postValidator,
      noopAuthGuard,
      noopThrottlerGuard
    ),
    new LikeRoute(
      createNoopControllerProxyForRouteRegistration(),
      userValidator,
      postValidator,
      noopAuthGuard,
      noopThrottlerGuard
    ),
    new MediaRoute(
      createNoopControllerProxyForRouteRegistration(),
      userValidator,
      noopAuthGuard,
      noopThrottlerGuard
    ),
    new OAuthRoute(createNoopControllerProxyForRouteRegistration(), noopThrottlerGuard),
    new PostRoute(
      createNoopControllerProxyForRouteRegistration(),
      postValidator,
      userValidator,
      noopAuthGuard,
      noopAuthOptionGuard,
      noopThrottlerGuard
    ),
    new SearchRoute(
      createNoopControllerProxyForRouteRegistration(),
      searchValidator,
      userValidator,
      noopAuthOptionGuard,
      noopThrottlerGuard
    ),
    new FriendRoute(
      createNoopControllerProxyForRouteRegistration(),
      friendValidator,
      userValidator,
      noopAuthGuard,
      noopThrottlerGuard
    ),
    new BlockRoute(
      createNoopControllerProxyForRouteRegistration(),
      blocksValidator,
      userValidator,
      noopAuthGuard,
      noopThrottlerGuard
    ),
    new ConversationRoute(
      createNoopControllerProxyForRouteRegistration(),
      conversationValidator,
      createNoopControllerProxyForRouteRegistration(),
      chatMessageValidator,
      userValidator,
      noopAuthGuard,
      noopThrottlerGuard
    ),
    new StaticRoute(createNoopControllerProxyForRouteRegistration(), noopThrottlerGuard),
    new NotificationRoute(
      createNoopControllerProxyForRouteRegistration(),
      notificationValidator,
      userValidator,
      noopAuthGuard,
      noopThrottlerGuard
    ),
    new RoleRoute(
      createNoopControllerProxyForRouteRegistration<IRoleController>(),
      rolesValidator,
      noopAuthGuard,
      noopAdminGuard,
      noopThrottlerGuard
    ),
    new PermissionRoute(
      createNoopControllerProxyForRouteRegistration<IPermissionController>(),
      permissionsValidator,
      noopAuthGuard,
      noopAdminGuard,
      noopThrottlerGuard
    )
  ];
}

/**
 * Chuỗi `module` lưu trên bản ghi permission: lấy từ `BaseRoute.pathName` (vd. `/auth` → `AUTH`).
 * Dùng khi cần lọc theo khu vực API.
 */
export function permissionModuleTagFromBaseRoutePath(baseRoutePath: string): string {
  const pathAfterLeadingSlash = baseRoutePath.replace(/^\//, '');
  if (!pathAfterLeadingSlash) {
    return 'ROOT';
  }
  return pathAfterLeadingSlash.toUpperCase().replace(/\//g, '-');
}
