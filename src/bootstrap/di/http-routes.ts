import { appConfig } from '@/bootstrap/config/app.config';
import { ContainerRepositories } from '@/bootstrap/di/repositories';
import { IAuthService } from '@/modules/auth/application/services/auth.service';
import { IOtpService } from '@/modules/auth/application/services/otp.service';
import { ITokenService } from '@/modules/auth/application/services/token.service.type';
import { Disable2FAInteractor } from '@/modules/auth/application/use-cases/disable-2fa/disable-2fa.interactor';
import { ForgotPasswordInteractor } from '@/modules/auth/application/use-cases/forgot-password/forgot-password.interactor';
import { GetGoogleAuthUrlInteractor } from '@/modules/auth/application/use-cases/get-google-auth-url/get-google-auth-url.interactor';
import { LoginEmailInteractor } from '@/modules/auth/application/use-cases/login-email/login-email.interactor';
import { LoginGoogleInteractor } from '@/modules/auth/application/use-cases/login-google/login-google.interactor';
import { LogoutInteractor } from '@/modules/auth/application/use-cases/logout/logout.interactor';
import { RefreshTokenInteractor } from '@/modules/auth/application/use-cases/refresh-token/refresh-token.interactor';
import { RegisterInteractor } from '@/modules/auth/application/use-cases/register/register.interactor';
import { SendOtpInteractor } from '@/modules/auth/application/use-cases/send-otp/send-otp.interactor';
import { Setup2FAInteractor } from '@/modules/auth/application/use-cases/setup-2fa/setup-2fa.interactor';
import { IBlockService } from '@/modules/block/application/services/block.service';
import { BlockUserInteractor } from '@/modules/block/application/use-cases/block-user/block-user.interactor';
import { GetBlockedUserInteractor } from '@/modules/block/application/use-cases/get-blocked-user/get-blocked-user.interactor';
import { UnblockUserInteractor } from '@/modules/block/application/use-cases/unblock-user/unblock-user.interactor';
import { BookmarkPostInteractor } from '@/modules/bookmark/application/use-cases/bookmark-post/bookmark-post.interactor';
import { UnbookmarkPostInteractor } from '@/modules/bookmark/application/use-cases/unbookmark-post/unbookmark-post.interactor';
import { IConversationService } from '@/modules/conversation/application/services/conversation.service';
import { CreateGroupInteractor } from '@/modules/conversation/application/use-cases/create-group/create-group.interactor';
import { GetConversationDetailInteractor } from '@/modules/conversation/application/use-cases/get-conversation-detail/get-conversation-detail.interactor';
import { GetConversationsInteractor } from '@/modules/conversation/application/use-cases/get-conversations/get-conversations.interactor';
import { GetMessagesInteractor } from '@/modules/conversation/application/use-cases/get-messages/get-messages.interactor';
import { GetOrCreateConversationInteractor } from '@/modules/conversation/application/use-cases/get-or-create-conversation/get-or-create-conversation.interactor';
import { InviteMemberInteractor } from '@/modules/conversation/application/use-cases/invite-member/invite-member.interactor';
import { KickMemberInteractor } from '@/modules/conversation/application/use-cases/kick-member/kick-member.interactor';
import { LeaveConversationInteractor as LeaveConversationHttpInteractor } from '@/modules/conversation/application/use-cases/leave-conversation/leave-conversation.interactor';
import { MarkReadInteractor } from '@/modules/conversation/application/use-cases/mark-read-message/mark-read-message.interactor';
import { SendMessageInteractor } from '@/modules/conversation/application/use-cases/send-message/send-message.interactor';
import { TransferAdminInteractor } from '@/modules/conversation/application/use-cases/transfer-admin/transfer-admin.interactor';
import { UpdateConversationInteractor } from '@/modules/conversation/application/use-cases/update-conversation/update-conversation.interactor';
import { UpdateMemberRoleInteractor } from '@/modules/conversation/application/use-cases/update-member-role/update-member-role.interactor';
import { ITwoFactorAuthPort } from '@/modules/core/application/ports/2fa.port';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { IEmailQueue } from '@/modules/core/application/ports/email-job.port';
import { FileStoragePort } from '@/modules/core/application/ports/file-storage.port';
import { IGoogleOAuthService } from '@/modules/core/application/ports/google-oauth.out-port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { ImageProcessorPort } from '@/modules/core/application/ports/image-processor.port';
import { RealtimeEmitterPort } from '@/modules/core/application/ports/realtime-emitter.port';
import { StoragePort } from '@/modules/core/application/ports/storage.port';
import { IVideoStreamQueue } from '@/modules/core/application/ports/video-stream-job.port';
import { LoggerPort } from '@/modules/core/infrastructure/logger/logger.port';
import { IFriendService } from '@/modules/friend/application/services/friend.service';
import { AcceptIncomingRequestInteractor } from '@/modules/friend/application/use-cases/accept-incoming-request/accept-incoming-request.interactor';
import { DeclineIncomingRequestInteractor } from '@/modules/friend/application/use-cases/decline-incoming-request/decline-incoming-request.interactor';
import { GetFriendsInteractor } from '@/modules/friend/application/use-cases/get-friends/get-friends.interactor';
import { GetIncomingRequestsInteractor } from '@/modules/friend/application/use-cases/get-incoming-requests/get-incoming-requests.interactor';
import { GetOutgoingRequestsInteractor } from '@/modules/friend/application/use-cases/get-outgoing-requests/get-outgoing-requests.interactor';
import { RevokeOutgoingRequestInteractor } from '@/modules/friend/application/use-cases/revoke-outgoing-request/revoke-outgoing-request.interactor';
import { SendFriendRequestInteractor } from '@/modules/friend/application/use-cases/send-friend-request/send-friend-request.interactor';
import { UnfriendInteractor } from '@/modules/friend/application/use-cases/unfriend/unfriend.interactor';
import { LikePostInteractor } from '@/modules/like/application/use-cases/like-post/like-post.interactor';
import { UnlikePostInteractor } from '@/modules/like/application/use-cases/unlike-post/unlike-post.interactor';
import { GetStaticVideoStreamInteractor } from '@/modules/media/application/use-cases/get-static-video-stream/get-static-video-stream.interactor';
import { GetVideoStatusInteractor } from '@/modules/media/application/use-cases/get-video-status/get-video-status.interactor';
import { UploadImageInteractor } from '@/modules/media/application/use-cases/upload-image/upload-image.interactor';
import { UploadVideoStreamInteractor } from '@/modules/media/application/use-cases/upload-video-stream/upload-video-stream.interactor';
import { UploadVideoInteractor } from '@/modules/media/application/use-cases/upload-video/upload-video.interactor';
import { INotificationsService } from '@/modules/notification/application/services/notification.service';
import { ListNotificationsInteractor } from '@/modules/notification/application/use-cases/list-notifications/list-notifications.interactor';
import { MarkNotificationReadInteractor } from '@/modules/notification/application/use-cases/mark-notification-read/mark-notification-read.interactor';
import { MarkNotificationsReadInteractor } from '@/modules/notification/application/use-cases/mark-notifications-read/mark-notifications-read.interactor';
import { CreatePermissionInteractor } from '@/modules/permission/application/use-cases/create-permission/create-permission.interactor';
import { DeletePermissionInteractor } from '@/modules/permission/application/use-cases/delete-permission/delete-permission.interactor';
import { GetPermissionInteractor } from '@/modules/permission/application/use-cases/get-permission/get-permission.interactor';
import { ListPermissionsInteractor } from '@/modules/permission/application/use-cases/list-permissions/list-permissions.interactor';
import { UpdatePermissionInteractor } from '@/modules/permission/application/use-cases/update-permission/update-permission.interactor';
import { PostAudienceAccessService } from '@/modules/post/application/services/post-audience-access.service';
import { IPostService } from '@/modules/post/application/services/post.service';
import { CreatePostInteractor } from '@/modules/post/application/use-cases/create-post/create-post.interactor';
import { GetGuestNewFeedsInteractor } from '@/modules/post/application/use-cases/get-guest-new-feeds/get-guest-new-feeds.interactor';
import { GetNewFeedsInteractor } from '@/modules/post/application/use-cases/get-new-feeds/get-new-feeds.interactor';
import { GetPostDetailInteractor } from '@/modules/post/application/use-cases/get-post-detail/get-post-detail.interactor';
import { GetPostsTypeInteractor } from '@/modules/post/application/use-cases/get-posts-type/get-posts-type.interactor';
import { IncreaseViewsInteractor } from '@/modules/post/application/use-cases/increase-views/increase-views.interactor';
import { SearchPostsInteractor } from '@/modules/post/application/use-cases/search-posts/search-posts.interactor';
import { UpdatePostInteractor } from '@/modules/post/application/use-cases/update-post/update-post.interactor';
import { IRoleService } from '@/modules/role/application/services/role.service';
import { CreateRoleInteractor } from '@/modules/role/application/use-cases/create-role/create-role.interactor';
import { DeleteRoleInteractor } from '@/modules/role/application/use-cases/delete-role/delete-role.interactor';
import { GetRoleInteractor } from '@/modules/role/application/use-cases/get-role/get-role.interactor';
import { ListRolesInteractor } from '@/modules/role/application/use-cases/list-roles/list-roles.interactor';
import { UpdateRoleInteractor } from '@/modules/role/application/use-cases/update-role/update-role.interactor';
import { IUserService } from '@/modules/user/application/services/user.service';
import { ChangePasswordInteractor } from '@/modules/user/application/use-cases/change-password/change-password.interactor';
import { GetMeInteractor } from '@/modules/user/application/use-cases/get-me/get-me.interactor';
import { GetUserProfileInteractor } from '@/modules/user/application/use-cases/get-user-profile/get-user-profile.interactor';
import { SearchUsersInteractor } from '@/modules/user/application/use-cases/search-users/search-users.interactor';
import { UpdateMeInteractor } from '@/modules/user/application/use-cases/update-me/update-me.interactor';
import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { AuthController, IAuthController } from '@/presentation/http/express/v1/controllers/auth.controller';
import { BlockController, IBlockController } from '@/presentation/http/express/v1/controllers/block.controller';
import {
  BookmarkController,
  IBookmarkController
} from '@/presentation/http/express/v1/controllers/bookmark.controller';
import {
  ChatMessageController,
  IChatMessageController
} from '@/presentation/http/express/v1/controllers/chat-message.controller';
import {
  ConversationController,
  IConversationController
} from '@/presentation/http/express/v1/controllers/conversation.controller';
import { FriendController, IFriendController } from '@/presentation/http/express/v1/controllers/friend.controller';
import { ILikeController, LikeController } from '@/presentation/http/express/v1/controllers/like.controller';
import { IMediaController, MediaController } from '@/presentation/http/express/v1/controllers/media.controller';
import {
  INotificationController,
  NotificationsController
} from '@/presentation/http/express/v1/controllers/notifications.controller';
import { IOAuthController, OAuthController } from '@/presentation/http/express/v1/controllers/oauth.controller';
import {
  IPermissionController,
  PermissionController
} from '@/presentation/http/express/v1/controllers/permission.controller';
import { IPostController, PostController } from '@/presentation/http/express/v1/controllers/post.controller';
import { IRoleController, RoleController } from '@/presentation/http/express/v1/controllers/role.controller';
import { ISearchController, SearchController } from '@/presentation/http/express/v1/controllers/search.controller';
import { IUserController, UserController } from '@/presentation/http/express/v1/controllers/user.controller';
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
import { AuthValidator, IAuthValidator } from '@/presentation/http/express/v1/validators/auth.validator';
import { BlocksValidator, IBlockValidator } from '@/presentation/http/express/v1/validators/block.validator';
import {
  ChatMessagesValidator,
  IChatMessageValidator
} from '@/presentation/http/express/v1/validators/chat-message.validator';
import {
  ConversationsValidator,
  IConversationValidator
} from '@/presentation/http/express/v1/validators/conversation.validator';
import { FriendsValidator, IFriendValidator } from '@/presentation/http/express/v1/validators/friend.validator';
import {
  INotificationValidator,
  NotificationsValidator
} from '@/presentation/http/express/v1/validators/notification.validator';
import {
  IPermissionsValidator,
  PermissionsValidator
} from '@/presentation/http/express/v1/validators/permission.validator';
import { IPostValidator, PostsValidator } from '@/presentation/http/express/v1/validators/post.validator';
import { IRolesValidator, RolesValidator } from '@/presentation/http/express/v1/validators/role.validator';
import { ISearchValidator, SearchValidator } from '@/presentation/http/express/v1/validators/search.validator';
import { IUserValidator, UsersValidator } from '@/presentation/http/express/v1/validators/user.validator';

export type HttpContext = ContainerRepositories & {
  logger: LoggerPort;
  redis: CacheManagerPort;
  realtimeEmitter: RealtimeEmitterPort;
  fileStorage: FileStoragePort;
  imageProcessor: ImageProcessorPort;
  emailQueue: IEmailQueue;
  videoStreamQueue: IVideoStreamQueue;
  googleOAuthService: IGoogleOAuthService;
  s3Service: StoragePort;
  tokenService: ITokenService;
  authService: IAuthService;
  userService: IUserService;
  friendService: IFriendService;
  blockService: IBlockService;
  postService: IPostService;
  conversationService: IConversationService;
  otpService: IOtpService;
  roleService: IRoleService;
  hashingService: HashingPort;
  notificationsService: INotificationsService;
  twoFactorService: ITwoFactorAuthPort;
};

export function buildHttpRouters(ctx: HttpContext): BaseRoute[] {
  const {
    userRepository,
    refreshTokenRepository,
    bookmarkRepository,
    likeRepository,
    friendshipRepository,
    friendRequestRepository,
    blockRepository,
    videoStatusRepository,
    postRepository,
    hashtagRepository,
    conversationRepository,
    conversationMemberRepository,
    chatMessageRepository,
    notificationRepository,
    otpRepository,
    roleRepository,
    permissionRepository,
    postQueryRepository,
    postCommandRepository,
    userQueryRepository,
    conversationMemberQueryRepository,
    logger,
    redis,
    realtimeEmitter,
    fileStorage,
    imageProcessor,
    emailQueue,
    videoStreamQueue,
    googleOAuthService,
    s3Service,
    tokenService,
    authService,
    userService,
    friendService,
    blockService,
    postService,
    conversationService,
    otpService,
    roleService,
    hashingService,
    notificationsService,
    twoFactorService
  } = ctx;

  // redis.del(CACHE_KEYS.user('entity_019dd4a5-0932-7551-b768-3ec46534c2a1'));

  const authGuard = new AuthGuard(roleRepository, tokenService);

  const registerUC = new RegisterInteractor(
    userRepository,
    authService,
    hashingService,
    otpRepository,
    otpService,
    roleService
  );
  const loginEmailUC = new LoginEmailInteractor(
    userQueryRepository,
    userRepository,
    roleRepository,
    otpService,
    hashingService,
    authService
  );
  const logoutUC = new LogoutInteractor(refreshTokenRepository);
  const refreshTokenUC = new RefreshTokenInteractor(
    refreshTokenRepository,
    userQueryRepository,
    roleRepository,
    userService,
    authService,
    tokenService
  );
  const forgotPasswordUC = new ForgotPasswordInteractor(
    userRepository,
    redis,
    otpRepository,
    hashingService,
    userService,
    otpService
  );
  const sendOtpUC = new SendOtpInteractor(otpRepository, userRepository, emailQueue);
  const setup2faUC = new Setup2FAInteractor(userRepository, userService, twoFactorService, redis);
  const disable2faUC = new Disable2FAInteractor(userRepository, userService, otpService, redis);

  const getGoogleAuthUrlUC = new GetGoogleAuthUrlInteractor(googleOAuthService);
  const loginGoogleUC = new LoginGoogleInteractor(
    googleOAuthService,
    userRepository,
    hashingService,
    roleService,
    authService,
    userService
  );

  const getMeUC = new GetMeInteractor(userService);
  const updateMeUC = new UpdateMeInteractor(userRepository, userService, redis);
  const getUserProfileUC = new GetUserProfileInteractor(userService, blockService);
  const changePasswordUC = new ChangePasswordInteractor(userRepository, hashingService, redis);

  const blockUserUC = new BlockUserInteractor(
    blockRepository,
    blockService,
    userRepository,
    friendshipRepository,
    friendRequestRepository,
    friendService
  );
  const unblockUserUC = new UnblockUserInteractor(blockRepository, friendService);
  const listBlockedUC = new GetBlockedUserInteractor(blockRepository, userRepository);

  const postAudienceAccessService = new PostAudienceAccessService(
    postQueryRepository,
    blockService,
    userService,
    friendService
  );

  const createBookmarkUC = new BookmarkPostInteractor(
    bookmarkRepository,
    postQueryRepository,
    postAudienceAccessService
  );
  const unbookmarkPostUC = new UnbookmarkPostInteractor(
    bookmarkRepository,
    postQueryRepository,
    postAudienceAccessService
  );

  const createLikeUC = new LikePostInteractor(likeRepository, postQueryRepository, postAudienceAccessService);
  const unlikeUC = new UnlikePostInteractor(likeRepository, postQueryRepository, postAudienceAccessService);

  const getVideoStatusUC = new GetVideoStatusInteractor(videoStatusRepository);
  const getStaticVideoStreamUC = new GetStaticVideoStreamInteractor(fileStorage);
  const uploadImageUC = new UploadImageInteractor(s3Service, imageProcessor, fileStorage);
  const uploadVideoUC = new UploadVideoInteractor(s3Service, fileStorage);
  const uploadVideoStreamUC = new UploadVideoStreamInteractor(videoStatusRepository, videoStreamQueue, appConfig);

  const getNewFeedsUC = new GetNewFeedsInteractor(
    postQueryRepository,
    postService,
    blockService,
    friendService,
    logger
  );
  const getGuestNewFeedsUC = new GetGuestNewFeedsInteractor(postQueryRepository, postService, logger);
  const increaseViewsUC = new IncreaseViewsInteractor(postCommandRepository);
  const getPostDetailUC = new GetPostDetailInteractor(postQueryRepository, postAudienceAccessService);
  const getPostsTypeUC = new GetPostsTypeInteractor(
    postQueryRepository,
    postAudienceAccessService,
    postService,
    blockService,
    logger
  );
  const createPostUC = new CreatePostInteractor(postRepository, hashtagRepository, blockService, friendService, logger);
  const updatePostUC = new UpdatePostInteractor(postRepository, logger);

  const searchPostsUC = new SearchPostsInteractor(postQueryRepository, friendService, postService, blockService);
  const searchUsersUC = new SearchUsersInteractor(userQueryRepository, friendService, redis);

  const listFriendsUC = new GetFriendsInteractor(friendshipRepository, userRepository);
  const listIncomingRequestsUC = new GetIncomingRequestsInteractor(friendRequestRepository, userQueryRepository);
  const listOutgoingRequestsUC = new GetOutgoingRequestsInteractor(friendRequestRepository, userQueryRepository);
  const sendFriendRequestUC = new SendFriendRequestInteractor(
    friendshipRepository,
    friendRequestRepository,
    friendService,
    blockRepository,
    userRepository,
    notificationsService
  );
  const acceptIncomingRequestUC = new AcceptIncomingRequestInteractor(
    friendshipRepository,
    friendRequestRepository,
    friendService,
    blockRepository,
    notificationsService
  );
  const declineIncomingRequestUC = new DeclineIncomingRequestInteractor(friendRequestRepository, friendService);
  const revokeOutgoingRequestUC = new RevokeOutgoingRequestInteractor(friendRequestRepository, friendService);
  const unfriendUC = new UnfriendInteractor(friendshipRepository, friendService);

  const createDirectUC = new GetOrCreateConversationInteractor(
    conversationRepository,
    conversationMemberRepository,
    conversationService,
    friendService,
    blockRepository
  );
  const createGroupUC = new CreateGroupInteractor(conversationRepository, friendshipRepository);
  const listConversationsUC = new GetConversationsInteractor(
    conversationRepository,
    conversationMemberRepository,
    conversationMemberQueryRepository,
    conversationService
  );
  const getConversationDetailUC = new GetConversationDetailInteractor(
    conversationMemberRepository,
    conversationService
  );
  const updateConversationUC = new UpdateConversationInteractor(conversationRepository, conversationService);
  const inviteMemberUC = new InviteMemberInteractor(
    conversationRepository,
    conversationMemberRepository,
    conversationService,
    friendService,
    notificationsService
  );
  const kickMemberUC = new KickMemberInteractor(
    conversationRepository,
    conversationMemberRepository,
    conversationService
  );
  const leaveConversationUC = new LeaveConversationHttpInteractor(conversationMemberRepository, conversationService);
  const updateMemberRoleUC = new UpdateMemberRoleInteractor(conversationMemberRepository, conversationService);
  const transferAdminUC = new TransferAdminInteractor(conversationMemberRepository, conversationService);

  const sendMessageUC = new SendMessageInteractor(
    conversationRepository,
    conversationMemberRepository,
    chatMessageRepository,
    blockRepository,
    notificationsService,
    conversationService,
    realtimeEmitter
  );
  const listMessagesUC = new GetMessagesInteractor(chatMessageRepository, conversationService);
  const markReadUC = new MarkReadInteractor(
    conversationMemberRepository,
    chatMessageRepository,
    conversationService,
    realtimeEmitter
  );

  const authController: IAuthController = new AuthController(
    registerUC,
    loginEmailUC,
    logoutUC,
    refreshTokenUC,
    forgotPasswordUC,
    sendOtpUC,
    setup2faUC,
    disable2faUC
  );
  const userController: IUserController = new UserController(getMeUC, updateMeUC, getUserProfileUC, changePasswordUC);
  const bookmarkController: IBookmarkController = new BookmarkController(createBookmarkUC, unbookmarkPostUC);
  const likeController: ILikeController = new LikeController(createLikeUC, unlikeUC);
  const mediaController: IMediaController = new MediaController(
    getVideoStatusUC,
    getStaticVideoStreamUC,
    uploadImageUC,
    uploadVideoUC,
    uploadVideoStreamUC,
    s3Service,
    fileStorage
  );
  const oauthController: IOAuthController = new OAuthController(getGoogleAuthUrlUC, loginGoogleUC);
  const postController: IPostController = new PostController(
    getNewFeedsUC,
    getGuestNewFeedsUC,
    getPostDetailUC,
    increaseViewsUC,
    getPostsTypeUC,
    createPostUC,
    updatePostUC
  );
  const searchController: ISearchController = new SearchController(searchPostsUC, searchUsersUC);
  const friendController: IFriendController = new FriendController(
    listFriendsUC,
    listIncomingRequestsUC,
    listOutgoingRequestsUC,
    sendFriendRequestUC,
    acceptIncomingRequestUC,
    declineIncomingRequestUC,
    revokeOutgoingRequestUC,
    unfriendUC
  );
  const blocksController: IBlockController = new BlockController(blockUserUC, unblockUserUC, listBlockedUC);
  const conversationController: IConversationController = new ConversationController(
    createDirectUC,
    createGroupUC,
    listConversationsUC,
    getConversationDetailUC,
    updateConversationUC,
    inviteMemberUC,
    kickMemberUC,
    leaveConversationUC,
    updateMemberRoleUC,
    transferAdminUC
  );
  const chatMessageController: IChatMessageController = new ChatMessageController(
    sendMessageUC,
    listMessagesUC,
    markReadUC
  );
  const listNotificationsUC = new ListNotificationsInteractor(notificationRepository, blockRepository);
  const markNotificationsReadUC = new MarkNotificationsReadInteractor(notificationRepository);
  const markNotificationReadUC = new MarkNotificationReadInteractor(notificationRepository);
  const notificationController: INotificationController = new NotificationsController(
    listNotificationsUC,
    markNotificationsReadUC,
    markNotificationReadUC
  );

  const listRolesUC = new ListRolesInteractor(roleRepository);
  const getRoleUC = new GetRoleInteractor(roleRepository);
  const createRoleUC = new CreateRoleInteractor(roleRepository);
  const updateRoleUC = new UpdateRoleInteractor(roleRepository);
  const deleteRoleUC = new DeleteRoleInteractor(roleRepository);
  const listPermissionsUC = new ListPermissionsInteractor(permissionRepository);

  const getPermissionUC = new GetPermissionInteractor(permissionRepository);
  const createPermissionUC = new CreatePermissionInteractor(permissionRepository);
  const updatePermissionUC = new UpdatePermissionInteractor(permissionRepository);
  const deletePermissionUC = new DeletePermissionInteractor(permissionRepository, roleRepository);
  const roleController: IRoleController = new RoleController(
    listRolesUC,
    getRoleUC,
    createRoleUC,
    updateRoleUC,
    deleteRoleUC
  );
  const permissionController: IPermissionController = new PermissionController(
    listPermissionsUC,
    getPermissionUC,
    createPermissionUC,
    updatePermissionUC,
    deletePermissionUC
  );

  const authValidator: IAuthValidator = new AuthValidator();
  const userValidator: IUserValidator = new UsersValidator(userService);
  const postValidator: IPostValidator = new PostsValidator();
  const searchValidator: ISearchValidator = new SearchValidator();
  const friendValidator: IFriendValidator = new FriendsValidator(userValidator);
  const blocksValidator: IBlockValidator = new BlocksValidator(userValidator);
  const conversationValidator: IConversationValidator = new ConversationsValidator(userValidator);
  const chatMessageValidator: IChatMessageValidator = new ChatMessagesValidator();
  const notificationValidator: INotificationValidator = new NotificationsValidator(userValidator);
  const rolesValidator: IRolesValidator = new RolesValidator();
  const permissionsValidator: IPermissionsValidator = new PermissionsValidator();

  const routers: BaseRoute[] = [
    new AuthRoute(authController, authValidator, authGuard),
    new UserRoute(userController, userValidator, authGuard),
    new BookmarkRoute(bookmarkController, userValidator, postValidator, authGuard),
    new LikeRoute(likeController, userValidator, postValidator, authGuard),
    new MediaRoute(mediaController, userValidator, authGuard),
    new OAuthRoute(oauthController),
    new PostRoute(postController, postValidator, userValidator, authGuard),
    new SearchRoute(searchController, searchValidator, userValidator, authGuard),
    new FriendRoute(friendController, friendValidator, userValidator, authGuard),
    new BlockRoute(blocksController, blocksValidator, userValidator, authGuard),
    new ConversationRoute(
      conversationController,
      conversationValidator,
      chatMessageController,
      chatMessageValidator,
      userValidator,
      authGuard
    ),
    new StaticRoute(mediaController),
    new NotificationRoute(notificationController, notificationValidator, userValidator, authGuard),
    new RoleRoute(roleController, roleService, userService, rolesValidator, authGuard),
    new PermissionRoute(permissionController, roleService, userService, permissionsValidator, authGuard)
  ];

  return routers;
}
