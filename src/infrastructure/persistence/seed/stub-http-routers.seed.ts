import { BaseRoute } from '@/presentation/http/routes/base.route';
import { AuthRoute } from '@/presentation/http/routes/auth.route';
import { BlockRoute } from '@/presentation/http/routes/block.route';
import { BookmarkRoute } from '@/presentation/http/routes/bookmark.route';
import { ConversationRoute } from '@/presentation/http/routes/conversation.route';
import { FriendRoute } from '@/presentation/http/routes/friend.route';
import { LikeRoute } from '@/presentation/http/routes/like.route';
import { MediaRoute } from '@/presentation/http/routes/media.route';
import { NotificationRoute } from '@/presentation/http/routes/notification.route';
import { OAuthRoute } from '@/presentation/http/routes/oauth.route';
import { PostRoute } from '@/presentation/http/routes/post.route';
import { SearchRoute } from '@/presentation/http/routes/search.route';
import { StaticRoute } from '@/presentation/http/routes/static.route';
import { UserRoute } from '@/presentation/http/routes/user.route';
import type { IAuthValidator } from '@/presentation/http/validators/auth.validator';
import type { IBlockValidator } from '@/presentation/http/validators/block.validator';
import type { IChatMessageValidator } from '@/presentation/http/validators/chat-message.validator';
import type { IConversationValidator } from '@/presentation/http/validators/conversation.validator';
import type { IFriendValidator } from '@/presentation/http/validators/friend.validator';
import type { INotificationValidator } from '@/presentation/http/validators/notification.validator';
import type { IPostValidator } from '@/presentation/http/validators/post.validator';
import type { ISearchValidator } from '@/presentation/http/validators/search.validator';
import type { IUserValidator } from '@/presentation/http/validators/user.validator';
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
      if (propertyKey === 'userIdValidator' || propertyKey === 'postIdValidator') {
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

  return [
    new AuthRoute(createNoopControllerProxyForRouteRegistration(), authValidator),
    new UserRoute(createNoopControllerProxyForRouteRegistration(), userValidator),
    new BookmarkRoute(createNoopControllerProxyForRouteRegistration(), userValidator, postValidator),
    new LikeRoute(createNoopControllerProxyForRouteRegistration(), userValidator, postValidator),
    new MediaRoute(createNoopControllerProxyForRouteRegistration(), userValidator),
    new OAuthRoute(createNoopControllerProxyForRouteRegistration()),
    new PostRoute(createNoopControllerProxyForRouteRegistration(), postValidator, userValidator),
    new SearchRoute(createNoopControllerProxyForRouteRegistration(), searchValidator),
    new FriendRoute(createNoopControllerProxyForRouteRegistration(), friendValidator, userValidator),
    new BlockRoute(createNoopControllerProxyForRouteRegistration(), blocksValidator, userValidator),
    new ConversationRoute(
      createNoopControllerProxyForRouteRegistration(),
      conversationValidator,
      createNoopControllerProxyForRouteRegistration(),
      chatMessageValidator,
      userValidator
    ),
    new StaticRoute(createNoopControllerProxyForRouteRegistration()),
    new NotificationRoute(createNoopControllerProxyForRouteRegistration(), notificationValidator, userValidator)
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
