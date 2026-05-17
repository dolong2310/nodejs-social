import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { CacheInterceptor } from '@/presentation/http/express/interceptors/cache.interceptor';
import type { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IHashtagController } from '@/presentation/http/express/v1/controllers/hashtag.controller';
import type { IPermissionController } from '@/presentation/http/express/v1/controllers/permission.controller';
import type { IRoleController } from '@/presentation/http/express/v1/controllers/role.controller';
import type { IAuthPipe } from '@/presentation/http/express/v1/pipes/auth.pipe';
import type { IBlockPipe } from '@/presentation/http/express/v1/pipes/block.pipe';
import type { IChatMessagePipe } from '@/presentation/http/express/v1/pipes/chat-message.pipe';
import type { IConversationPipe } from '@/presentation/http/express/v1/pipes/conversation.pipe';
import type { IFriendPipe } from '@/presentation/http/express/v1/pipes/friend.pipe';
import type { IHashtagsPipe } from '@/presentation/http/express/v1/pipes/hashtag.pipe';
import type { INotificationPipe } from '@/presentation/http/express/v1/pipes/notification.pipe';
import type { IOperationsController } from '@/presentation/http/express/v1/controllers/operations.controller';
import type { IPaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import type { IPermissionsPipe } from '@/presentation/http/express/v1/pipes/permission.pipe';
import type { IPostPipe } from '@/presentation/http/express/v1/pipes/post.pipe';
import type { IRolesPipe } from '@/presentation/http/express/v1/pipes/role.pipe';
import type { ISearchPipe } from '@/presentation/http/express/v1/pipes/search.pipe';
import type { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { AuthRoute } from '@/presentation/http/express/v1/routes/auth.route';
import { BlockRoute } from '@/presentation/http/express/v1/routes/block.route';
import { ConversationRoute } from '@/presentation/http/express/v1/routes/conversation.route';
import { FriendRoute } from '@/presentation/http/express/v1/routes/friend.route';
import { HashtagRoute } from '@/presentation/http/express/v1/routes/hashtag.route';
import { MediaRoute } from '@/presentation/http/express/v1/routes/media.route';
import { NotificationRoute } from '@/presentation/http/express/v1/routes/notification.route';
import { OAuthRoute } from '@/presentation/http/express/v1/routes/oauth.route';
import { OperationsRoute } from '@/presentation/http/express/v1/routes/operations.route';
import { PermissionRoute } from '@/presentation/http/express/v1/routes/permission.route';
import { PostRoute } from '@/presentation/http/express/v1/routes/post.route';
import { RoleRoute } from '@/presentation/http/express/v1/routes/role.route';
import { SearchRoute } from '@/presentation/http/express/v1/routes/search.route';
import { StaticRoute } from '@/presentation/http/express/v1/routes/static.route';
import { UserRoute } from '@/presentation/http/express/v1/routes/user.route';
import type { RequestHandler } from 'express';

/** Middleware rỗng: chỉ gọi `next()` — dùng khi cần object pipe/controller giả cho Express đăng ký route, không thực thi logic. */
const nextOnlyMiddleware: RequestHandler = (_request, _response, next) => {
  next();
};

/**
 * Tạo proxy giả: mỗi field là `nextOnlyMiddleware`, hoặc factory trả về nó (userId / postId).
 * Chỉ phục vụ bước khai báo route trong constructor — không dùng xử lý request thật.
 */
function createNoopPipeProxyForRouteRegistration<T extends object>(): T {
  return new Proxy({} as T, {
    get(_target, propertyKey: string | symbol) {
      if (
        propertyKey === 'userIdPipe' ||
        propertyKey === 'postIdPipe' ||
        propertyKey === 'roleIdParam' ||
        propertyKey === 'createBodyPipe' ||
        propertyKey === 'updateBodyPipe' ||
        propertyKey === 'permissionIdParam' ||
        propertyKey === 'hashtagIdParam'
      ) {
        return () => nextOnlyMiddleware;
      }
      return nextOnlyMiddleware;
    }
  });
}

/**
 * Tạo proxy controller giả: mỗi method trả về hàm async rỗng (đủ cho route + `interceptor`).
 */
function createNoopControllerProxyForRouteRegistration<T extends object>(): T {
  return new Proxy({} as T, {
    get() {
      return async () => {};
    }
  });
}

const noopAuthGuard = new Proxy({} as AuthGuard, { get: () => nextOnlyMiddleware });
const noopApiKeyGuard = new Proxy({} as ApiKeyGuard, { get: () => nextOnlyMiddleware });
const noopAuthOptionGuard = new Proxy({} as AuthOptionGuard, { get: () => nextOnlyMiddleware });
const noopThrottlerGuard = new Proxy({} as ThrottlerProxyGuard, { get: () => () => nextOnlyMiddleware });
const noopInterceptor = new Proxy(
  {} as LoggingInterceptor &
    TransformResponseInterceptor &
    TimeoutInterceptor &
    IdempotencyInterceptor &
    CacheInterceptor,
  {
    get: () => async (_request: unknown, _response: unknown, next?: () => unknown) => next?.()
  }
);

/**
 * Thứ tự giống `buildHttpRouters` để danh sách route trùng runtime.
 */
export function buildStubHttpRouters(): BaseRoute[] {
  const authPipe: IAuthPipe = createNoopPipeProxyForRouteRegistration();
  const userPipe: IUserPipe = createNoopPipeProxyForRouteRegistration();
  const postPipe: IPostPipe = createNoopPipeProxyForRouteRegistration();
  const paginationPipe: IPaginationPipe = createNoopPipeProxyForRouteRegistration();
  const searchPipe: ISearchPipe = createNoopPipeProxyForRouteRegistration();
  const friendPipe: IFriendPipe = createNoopPipeProxyForRouteRegistration();
  const blocksPipe: IBlockPipe = createNoopPipeProxyForRouteRegistration();
  const conversationPipe: IConversationPipe = createNoopPipeProxyForRouteRegistration();
  const chatMessagePipe: IChatMessagePipe = createNoopPipeProxyForRouteRegistration();
  const notificationPipe: INotificationPipe = createNoopPipeProxyForRouteRegistration();
  const rolesPipe: IRolesPipe = createNoopPipeProxyForRouteRegistration();
  const permissionsPipe: IPermissionsPipe = createNoopPipeProxyForRouteRegistration();
  const hashtagsPipe: IHashtagsPipe = createNoopPipeProxyForRouteRegistration();

  return [
    new OperationsRoute(
      createNoopControllerProxyForRouteRegistration<IOperationsController>(),
      noopApiKeyGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new AuthRoute(
      createNoopControllerProxyForRouteRegistration(),
      authPipe,
      noopAuthGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new UserRoute(
      createNoopControllerProxyForRouteRegistration(),
      userPipe,
      noopAuthGuard,
      noopAuthOptionGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new MediaRoute(
      createNoopControllerProxyForRouteRegistration(),
      userPipe,
      noopAuthGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new OAuthRoute(
      createNoopControllerProxyForRouteRegistration(),
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new PostRoute(
      createNoopControllerProxyForRouteRegistration(),
      postPipe,
      paginationPipe,
      userPipe,
      noopAuthGuard,
      noopAuthOptionGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new SearchRoute(
      createNoopControllerProxyForRouteRegistration(),
      searchPipe,
      paginationPipe,
      userPipe,
      noopAuthOptionGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new FriendRoute(
      createNoopControllerProxyForRouteRegistration(),
      friendPipe,
      paginationPipe,
      userPipe,
      noopAuthGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new BlockRoute(
      createNoopControllerProxyForRouteRegistration(),
      blocksPipe,
      paginationPipe,
      userPipe,
      noopAuthGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new ConversationRoute(
      createNoopControllerProxyForRouteRegistration(),
      conversationPipe,
      createNoopControllerProxyForRouteRegistration(),
      chatMessagePipe,
      paginationPipe,
      userPipe,
      noopAuthGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new StaticRoute(
      createNoopControllerProxyForRouteRegistration(),
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new NotificationRoute(
      createNoopControllerProxyForRouteRegistration(),
      notificationPipe,
      paginationPipe,
      userPipe,
      noopAuthGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new RoleRoute(
      createNoopControllerProxyForRouteRegistration<IRoleController>(),
      rolesPipe,
      paginationPipe,
      noopAuthGuard,
      noopApiKeyGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new PermissionRoute(
      createNoopControllerProxyForRouteRegistration<IPermissionController>(),
      permissionsPipe,
      paginationPipe,
      noopAuthGuard,
      noopApiKeyGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new HashtagRoute(
      createNoopControllerProxyForRouteRegistration<IHashtagController>(),
      hashtagsPipe,
      paginationPipe,
      noopAuthGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
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
