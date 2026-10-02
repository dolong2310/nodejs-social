import type { BaseRoute } from '@/presentation/http/express/core/base.route';
import type { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import type { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import type { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { CacheInterceptor } from '@/presentation/http/express/interceptors/cache.interceptor';
import type { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IAdminUserController } from '@/presentation/http/express/v1/controllers/admin-user.controller';
import type { IHashtagController } from '@/presentation/http/express/v1/controllers/hashtag.controller';
import type { IOperationsController } from '@/presentation/http/express/v1/controllers/operations.controller';
import type { IPermissionController } from '@/presentation/http/express/v1/controllers/permission.controller';
import type { IRoleController } from '@/presentation/http/express/v1/controllers/role.controller';
import { AdminUserRoute } from '@/presentation/http/express/v1/routes/admin-user.route';
import { AuthRoute } from '@/presentation/http/express/v1/routes/auth.route';
import { BlockRoute } from '@/presentation/http/express/v1/routes/block.route';
import { ConversationRoute } from '@/presentation/http/express/v1/routes/conversation.route';
import { FriendRoute } from '@/presentation/http/express/v1/routes/friend.route';
import { HashtagRoute } from '@/presentation/http/express/v1/routes/hashtag.route';
import { MediaRoute } from '@/presentation/http/express/v1/routes/media.route';
import { NotificationRoute } from '@/presentation/http/express/v1/routes/notification.route';
import { OAuthRoute } from '@/presentation/http/express/v1/routes/oauth.route';
import { OperationsRoute } from '@/presentation/http/express/v1/routes/operations.route';
import { PaymentCallbackRoute } from '@/presentation/http/express/v1/routes/payment-callback.route';
import { PaymentRoute } from '@/presentation/http/express/v1/routes/payment.route';
import { PermissionRoute } from '@/presentation/http/express/v1/routes/permission.route';
import { PostRoute } from '@/presentation/http/express/v1/routes/post.route';
import { RoleRoute } from '@/presentation/http/express/v1/routes/role.route';
import { SearchRoute } from '@/presentation/http/express/v1/routes/search.route';
import { StaticRoute } from '@/presentation/http/express/v1/routes/static.route';
import { UserRoute } from '@/presentation/http/express/v1/routes/user.route';
import type { IPaymentController } from '@/presentation/http/express/v1/controllers/payment.controller';
import type { IPaymentCallbackController } from '@/presentation/http/express/v1/controllers/payment-callback.controller';
import type { RequestHandler } from 'express';

/** Empty middleware: only calls `next()`. Used for fake pipe/controller objects when Express registers routes without running logic. */
const nextOnlyMiddleware: RequestHandler = (_request, _response, next) => {
  next();
};

/**
 * Create a fake controller proxy: each method returns an empty async function, enough for route + `interceptor`.
 */
function createNoopControllerProxyForRouteRegistration<T extends object>(): T {
  return new Proxy({} as T, {
    get() {
      return async () => {};
    }
  });
}

const noopAuthGuard = new Proxy({} as AuthGuard, { get: () => nextOnlyMiddleware });
const noopActiveUserGuard = new Proxy({} as ActiveUserGuard, { get: () => nextOnlyMiddleware });
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
 * Keep the same order as `buildHttpRouters` so the route list matches runtime.
 */
export function buildStubHttpRouters(): BaseRoute[] {
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
      noopAuthGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new AdminUserRoute(
      createNoopControllerProxyForRouteRegistration<IAdminUserController>(),
      noopAuthGuard,
      noopApiKeyGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new UserRoute(
      createNoopControllerProxyForRouteRegistration(),
      noopAuthGuard,
      noopAuthOptionGuard,
      noopActiveUserGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new MediaRoute(
      createNoopControllerProxyForRouteRegistration(),
      noopAuthGuard,
      noopActiveUserGuard,
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
      noopAuthGuard,
      noopAuthOptionGuard,
      noopActiveUserGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new SearchRoute(
      createNoopControllerProxyForRouteRegistration(),
      noopAuthOptionGuard,
      noopActiveUserGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new FriendRoute(
      createNoopControllerProxyForRouteRegistration(),
      noopAuthGuard,
      noopActiveUserGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new BlockRoute(
      createNoopControllerProxyForRouteRegistration(),
      noopAuthGuard,
      noopActiveUserGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new ConversationRoute(
      createNoopControllerProxyForRouteRegistration(),
      createNoopControllerProxyForRouteRegistration(),
      noopAuthGuard,
      noopActiveUserGuard,
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
      noopAuthGuard,
      noopActiveUserGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new RoleRoute(
      createNoopControllerProxyForRouteRegistration<IRoleController>(),
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
      noopAuthGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new PaymentRoute(
      createNoopControllerProxyForRouteRegistration<IPaymentController>(),
      noopAuthGuard,
      noopActiveUserGuard,
      noopThrottlerGuard,
      noopInterceptor,
      noopInterceptor,
      noopInterceptor
    ),
    new PaymentCallbackRoute(createNoopControllerProxyForRouteRegistration<IPaymentCallbackController>())
  ];
}

/**
 * The `module` string stored on permission records comes from `BaseRoute.pathName`, e.g. `/auth` -> `AUTH`.
 * Used when filtering by API area.
 */
export function permissionModuleTagFromBaseRoutePath(baseRoutePath: string): string {
  const pathAfterLeadingSlash = baseRoutePath.replace(/^\//, '');
  if (!pathAfterLeadingSlash) {
    return 'ROOT';
  }
  return pathAfterLeadingSlash.toUpperCase().replace(/\//g, '-');
}
