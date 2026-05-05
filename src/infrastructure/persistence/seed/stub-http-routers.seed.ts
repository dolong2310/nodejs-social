import { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { IHashtagController } from '@/presentation/http/express/v1/controllers/hashtag.controller';
import type { IPermissionController } from '@/presentation/http/express/v1/controllers/permission.controller';
import type { IRoleController } from '@/presentation/http/express/v1/controllers/role.controller';
import { AuthRoute } from '@/presentation/http/express/v1/routes/auth.route';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { BlockRoute } from '@/presentation/http/express/v1/routes/block.route';
import { BookmarkRoute } from '@/presentation/http/express/v1/routes/bookmark.route';
import { ConversationRoute } from '@/presentation/http/express/v1/routes/conversation.route';
import { FriendRoute } from '@/presentation/http/express/v1/routes/friend.route';
import { HashtagRoute } from '@/presentation/http/express/v1/routes/hashtag.route';
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
import type { IAuthPipe } from '@/presentation/http/express/v1/pipes/auth.pipe';
import type { IBlockPipe } from '@/presentation/http/express/v1/pipes/block.pipe';
import type { IChatMessagePipe } from '@/presentation/http/express/v1/pipes/chat-message.pipe';
import type { IConversationPipe } from '@/presentation/http/express/v1/pipes/conversation.pipe';
import type { IFriendPipe } from '@/presentation/http/express/v1/pipes/friend.pipe';
import type { IHashtagsPipe } from '@/presentation/http/express/v1/pipes/hashtag.pipe';
import type { INotificationPipe } from '@/presentation/http/express/v1/pipes/notification.pipe';
import type { IPermissionsPipe } from '@/presentation/http/express/v1/pipes/permission.pipe';
import type { IPostPipe } from '@/presentation/http/express/v1/pipes/post.pipe';
import type { IRolesPipe } from '@/presentation/http/express/v1/pipes/role.pipe';
import type { ISearchPipe } from '@/presentation/http/express/v1/pipes/search.pipe';
import type { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
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
const noopApiKeyGuard = new Proxy({} as ApiKeyGuard, { get: () => nextOnlyMiddleware });
const noopAuthOptionGuard = new Proxy({} as AuthOptionGuard, { get: () => nextOnlyMiddleware });

/**
 * Thứ tự giống `buildHttpRouters` để danh sách route trùng runtime.
 */
export function buildStubHttpRouters(): BaseRoute[] {
  const authPipe: IAuthPipe = createNoopPipeProxyForRouteRegistration();
  const userPipe: IUserPipe = createNoopPipeProxyForRouteRegistration();
  const postPipe: IPostPipe = createNoopPipeProxyForRouteRegistration();
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
    new AuthRoute(createNoopControllerProxyForRouteRegistration(), authPipe, noopAuthGuard),
    new UserRoute(createNoopControllerProxyForRouteRegistration(), userPipe, noopAuthGuard, noopAuthOptionGuard),
    new BookmarkRoute(createNoopControllerProxyForRouteRegistration(), userPipe, postPipe, noopAuthGuard),
    new LikeRoute(createNoopControllerProxyForRouteRegistration(), userPipe, postPipe, noopAuthGuard),
    new MediaRoute(createNoopControllerProxyForRouteRegistration(), userPipe, noopAuthGuard),
    new OAuthRoute(createNoopControllerProxyForRouteRegistration()),
    new PostRoute(
      createNoopControllerProxyForRouteRegistration(),
      postPipe,
      userPipe,
      noopAuthGuard,
      noopAuthOptionGuard
    ),
    new SearchRoute(createNoopControllerProxyForRouteRegistration(), searchPipe, userPipe, noopAuthOptionGuard),
    new FriendRoute(createNoopControllerProxyForRouteRegistration(), friendPipe, userPipe, noopAuthGuard),
    new BlockRoute(createNoopControllerProxyForRouteRegistration(), blocksPipe, userPipe, noopAuthGuard),
    new ConversationRoute(
      createNoopControllerProxyForRouteRegistration(),
      conversationPipe,
      createNoopControllerProxyForRouteRegistration(),
      chatMessagePipe,
      userPipe,
      noopAuthGuard
    ),
    new StaticRoute(createNoopControllerProxyForRouteRegistration()),
    new NotificationRoute(createNoopControllerProxyForRouteRegistration(), notificationPipe, userPipe, noopAuthGuard),
    new RoleRoute(
      createNoopControllerProxyForRouteRegistration<IRoleController>(),
      rolesPipe,
      noopAuthGuard,
      noopApiKeyGuard
    ),
    new PermissionRoute(
      createNoopControllerProxyForRouteRegistration<IPermissionController>(),
      permissionsPipe,
      noopAuthGuard,
      noopApiKeyGuard
    ),
    new HashtagRoute(createNoopControllerProxyForRouteRegistration<IHashtagController>(), hashtagsPipe, noopAuthGuard)
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
