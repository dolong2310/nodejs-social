import { appConfig } from '@/bootstrap/config/app.config';
import { ContainerRepositories } from '@/bootstrap/di/repositories';
import { TwoFactorAuthPort } from '@/modules/authentication/application/ports/2fa.port';
import { GoogleOAuthServicePort } from '@/modules/authentication/application/ports/google-oauth.port';
import { OtpEmailQueuePort } from '@/modules/authentication/application/ports/otp-email-job.port';
import { AuthServicePort } from '@/modules/authentication/application/services/auth.service';
import { OtpServicePort } from '@/modules/authentication/application/services/otp.service';
import { TokenServicePort } from '@/modules/authentication/application/services/token.service.type';
import { Disable2FAUseCase } from '@/modules/authentication/application/use-cases/disable-2fa/disable-2fa.usecase';
import { ForgotPasswordUseCase } from '@/modules/authentication/application/use-cases/forgot-password/forgot-password.usecase';
import { GetGoogleAuthUrlUseCase } from '@/modules/authentication/application/use-cases/get-google-auth-url/get-google-auth-url.usecase';
import { LoginEmailUseCase } from '@/modules/authentication/application/use-cases/login-email/login-email.usecase';
import { LoginGoogleUseCase } from '@/modules/authentication/application/use-cases/login-google/login-google.usecase';
import { LogoutUseCase } from '@/modules/authentication/application/use-cases/logout/logout.usecase';
import { RefreshTokenUseCase } from '@/modules/authentication/application/use-cases/refresh-token/refresh-token.usecase';
import { RegisterUseCase } from '@/modules/authentication/application/use-cases/register/register.usecase';
import { SendOtpUseCase } from '@/modules/authentication/application/use-cases/send-otp/send-otp.usecase';
import { Setup2FAUseCase } from '@/modules/authentication/application/use-cases/setup-2fa/setup-2fa.usecase';
import { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { CreatePermissionUseCase } from '@/modules/authorization/application/use-cases/create-permission/create-permission.usecase';
import { CreateRoleUseCase } from '@/modules/authorization/application/use-cases/create-role/create-role.usecase';
import { DeletePermissionUseCase } from '@/modules/authorization/application/use-cases/delete-permission/delete-permission.usecase';
import { DeleteRoleUseCase } from '@/modules/authorization/application/use-cases/delete-role/delete-role.usecase';
import { GetPermissionUseCase } from '@/modules/authorization/application/use-cases/get-permission/get-permission.usecase';
import { GetRoleUseCase } from '@/modules/authorization/application/use-cases/get-role/get-role.usecase';
import { ListPermissionsUseCase } from '@/modules/authorization/application/use-cases/list-permissions/list-permissions.usecase';
import { ListRolesUseCase } from '@/modules/authorization/application/use-cases/list-roles/list-roles.usecase';
import { UpdatePermissionUseCase } from '@/modules/authorization/application/use-cases/update-permission/update-permission.usecase';
import { UpdateRoleUseCase } from '@/modules/authorization/application/use-cases/update-role/update-role.usecase';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import { CreateGroupUseCase } from '@/modules/conversation/application/use-cases/create-group/create-group.usecase';
import { GetConversationDetailUseCase } from '@/modules/conversation/application/use-cases/get-conversation-detail/get-conversation-detail.usecase';
import { GetConversationsUseCase } from '@/modules/conversation/application/use-cases/get-conversations/get-conversations.usecase';
import { GetMessagesUseCase } from '@/modules/conversation/application/use-cases/get-messages/get-messages.usecase';
import { GetOrCreateConversationUseCase } from '@/modules/conversation/application/use-cases/get-or-create-conversation/get-or-create-conversation.usecase';
import { InviteMemberUseCase } from '@/modules/conversation/application/use-cases/invite-member/invite-member.usecase';
import { KickMemberUseCase } from '@/modules/conversation/application/use-cases/kick-member/kick-member.usecase';
import { LeaveConversationUseCase as LeaveConversationHttpUseCase } from '@/modules/conversation/application/use-cases/leave-conversation/leave-conversation.usecase';
import { MarkReadUseCase } from '@/modules/conversation/application/use-cases/mark-read-message/mark-read-message.usecase';
import { SendMessageUseCase } from '@/modules/conversation/application/use-cases/send-message/send-message.usecase';
import { TransferAdminUseCase } from '@/modules/conversation/application/use-cases/transfer-admin/transfer-admin.usecase';
import { UpdateConversationUseCase } from '@/modules/conversation/application/use-cases/update-conversation/update-conversation.usecase';
import { UpdateMemberRoleUseCase } from '@/modules/conversation/application/use-cases/update-member-role/update-member-role.usecase';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { RealtimeEmitterPort } from '@/modules/core/application/ports/realtime-emitter.port';
import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { ImageProcessorPort } from '@/modules/media/application/ports/image-processor.port';
import { ObjectStoragePort } from '@/modules/media/application/ports/object-storage.port';
import { VideoStreamQueuePort } from '@/modules/media/application/ports/video-stream-job.port';
import { GetStaticVideoStreamUseCase } from '@/modules/media/application/use-cases/get-static-video-stream/get-static-video-stream.usecase';
import { GetVideoStatusUseCase } from '@/modules/media/application/use-cases/get-video-status/get-video-status.usecase';
import { UploadImageUseCase } from '@/modules/media/application/use-cases/upload-image/upload-image.usecase';
import { UploadVideoStreamUseCase } from '@/modules/media/application/use-cases/upload-video-stream/upload-video-stream.usecase';
import { UploadVideoUseCase } from '@/modules/media/application/use-cases/upload-video/upload-video.usecase';
import { NotificationServicePort } from '@/modules/notification/application/services/notification.service';
import { ListNotificationsUseCase } from '@/modules/notification/application/use-cases/list-notifications/list-notifications.usecase';
import { MarkNotificationReadUseCase } from '@/modules/notification/application/use-cases/mark-notification-read/mark-notification-read.usecase';
import { MarkNotificationsReadUseCase } from '@/modules/notification/application/use-cases/mark-notifications-read/mark-notifications-read.usecase';
import { PostAudienceAccessService } from '@/modules/post/application/services/post-audience-access.service';
import { PostServicePort } from '@/modules/post/application/services/post.service';
import { BookmarkPostUseCase } from '@/modules/post/application/use-cases/bookmark-post/bookmark-post.usecase';
import { CreateHashtagUseCase } from '@/modules/post/application/use-cases/create-hashtag/create-hashtag.usecase';
import { CreatePostUseCase } from '@/modules/post/application/use-cases/create-post/create-post.usecase';
import { DeleteHashtagUseCase } from '@/modules/post/application/use-cases/delete-hashtag/delete-hashtag.usecase';
import { DeletePostUseCase } from '@/modules/post/application/use-cases/delete-post/delete-post.usecase';
import { GetGuestNewFeedsUseCase } from '@/modules/post/application/use-cases/get-guest-new-feeds/get-guest-new-feeds.usecase';
import { GetHashtagUseCase } from '@/modules/post/application/use-cases/get-hashtag/get-hashtag.usecase';
import { GetNewFeedsUseCase } from '@/modules/post/application/use-cases/get-new-feeds/get-new-feeds.usecase';
import { GetPostDetailUseCase } from '@/modules/post/application/use-cases/get-post-detail/get-post-detail.usecase';
import { GetPostsTypeUseCase } from '@/modules/post/application/use-cases/get-posts-type/get-posts-type.usecase';
import { IncreaseViewsUseCase } from '@/modules/post/application/use-cases/increase-views/increase-views.usecase';
import { LikePostUseCase } from '@/modules/post/application/use-cases/like-post/like-post.usecase';
import { ListHashtagsUseCase } from '@/modules/post/application/use-cases/list-hashtags/list-hashtags.usecase';
import { SearchPostsUseCase } from '@/modules/post/application/use-cases/search-posts/search-posts.usecase';
import { UnbookmarkPostUseCase } from '@/modules/post/application/use-cases/unbookmark-post/unbookmark-post.usecase';
import { UnlikePostUseCase } from '@/modules/post/application/use-cases/unlike-post/unlike-post.usecase';
import { UpdateHashtagUseCase } from '@/modules/post/application/use-cases/update-hashtag/update-hashtag.usecase';
import { UpdatePostUseCase } from '@/modules/post/application/use-cases/update-post/update-post.usecase';
import { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import { AcceptIncomingRequestUseCase } from '@/modules/relationship/application/use-cases/accept-incoming-request/accept-incoming-request.usecase';
import { BlockUserUseCase } from '@/modules/relationship/application/use-cases/block-user/block-user.usecase';
import { DeclineIncomingRequestUseCase } from '@/modules/relationship/application/use-cases/decline-incoming-request/decline-incoming-request.usecase';
import { GetBlockedUserUseCase } from '@/modules/relationship/application/use-cases/get-blocked-user/get-blocked-user.usecase';
import { GetFriendsUseCase } from '@/modules/relationship/application/use-cases/get-friends/get-friends.usecase';
import { GetIncomingRequestsUseCase } from '@/modules/relationship/application/use-cases/get-incoming-requests/get-incoming-requests.usecase';
import { GetOutgoingRequestsUseCase } from '@/modules/relationship/application/use-cases/get-outgoing-requests/get-outgoing-requests.usecase';
import { RevokeOutgoingRequestUseCase } from '@/modules/relationship/application/use-cases/revoke-outgoing-request/revoke-outgoing-request.usecase';
import { SendFriendRequestUseCase } from '@/modules/relationship/application/use-cases/send-friend-request/send-friend-request.usecase';
import { UnblockUserUseCase } from '@/modules/relationship/application/use-cases/unblock-user/unblock-user.usecase';
import { UnfriendUseCase } from '@/modules/relationship/application/use-cases/unfriend/unfriend.usecase';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { ChangePasswordUseCase } from '@/modules/user/application/use-cases/change-password/change-password.usecase';
import { GetMeUseCase } from '@/modules/user/application/use-cases/get-me/get-me.usecase';
import { GetUserProfileUseCase } from '@/modules/user/application/use-cases/get-user-profile/get-user-profile.usecase';
import { SearchUsersUseCase } from '@/modules/user/application/use-cases/search-users/search-users.usecase';
import { UpdateMeUseCase } from '@/modules/user/application/use-cases/update-me/update-me.usecase';
import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { CacheInterceptor } from '@/presentation/http/express/interceptors/cache.interceptor';
import { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { AuthController, IAuthController } from '@/presentation/http/express/v1/controllers/auth.controller';
import { BlockController, IBlockController } from '@/presentation/http/express/v1/controllers/block.controller';
import {
  ChatMessageController,
  IChatMessageController
} from '@/presentation/http/express/v1/controllers/chat-message.controller';
import {
  ConversationController,
  IConversationController
} from '@/presentation/http/express/v1/controllers/conversation.controller';
import { FriendController, IFriendController } from '@/presentation/http/express/v1/controllers/friend.controller';
import { HashtagController, IHashtagController } from '@/presentation/http/express/v1/controllers/hashtag.controller';
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
import { AuthPipe, IAuthPipe } from '@/presentation/http/express/v1/pipes/auth.pipe';
import { BlocksPipe, IBlockPipe } from '@/presentation/http/express/v1/pipes/block.pipe';
import { ChatMessagesPipe, IChatMessagePipe } from '@/presentation/http/express/v1/pipes/chat-message.pipe';
import { ConversationsPipe, IConversationPipe } from '@/presentation/http/express/v1/pipes/conversation.pipe';
import { FriendsPipe, IFriendPipe } from '@/presentation/http/express/v1/pipes/friend.pipe';
import { HashtagsPipe, IHashtagsPipe } from '@/presentation/http/express/v1/pipes/hashtag.pipe';
import { INotificationPipe, NotificationsPipe } from '@/presentation/http/express/v1/pipes/notification.pipe';
import { IPaginationPipe, PaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IPermissionsPipe, PermissionsPipe } from '@/presentation/http/express/v1/pipes/permission.pipe';
import { IPostPipe, PostsPipe } from '@/presentation/http/express/v1/pipes/post.pipe';
import { IRolesPipe, RolesPipe } from '@/presentation/http/express/v1/pipes/role.pipe';
import { ISearchPipe, SearchPipe } from '@/presentation/http/express/v1/pipes/search.pipe';
import { IUserPipe, UsersPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { AuthRoute } from '@/presentation/http/express/v1/routes/auth.route';
import { BlockRoute } from '@/presentation/http/express/v1/routes/block.route';
import { ConversationRoute } from '@/presentation/http/express/v1/routes/conversation.route';
import { FriendRoute } from '@/presentation/http/express/v1/routes/friend.route';
import { HashtagRoute } from '@/presentation/http/express/v1/routes/hashtag.route';
import { MediaRoute } from '@/presentation/http/express/v1/routes/media.route';
import { NotificationRoute } from '@/presentation/http/express/v1/routes/notification.route';
import { OAuthRoute } from '@/presentation/http/express/v1/routes/oauth.route';
import { PermissionRoute } from '@/presentation/http/express/v1/routes/permission.route';
import { PostRoute } from '@/presentation/http/express/v1/routes/post.route';
import { RoleRoute } from '@/presentation/http/express/v1/routes/role.route';
import { SearchRoute } from '@/presentation/http/express/v1/routes/search.route';
import { StaticRoute } from '@/presentation/http/express/v1/routes/static.route';
import { UserRoute } from '@/presentation/http/express/v1/routes/user.route';

export type HttpContext = ContainerRepositories & {
  logger: LoggerPort;
  cacheManager: CacheManagerPort;
  cacheStrategy: CacheStrategyPort;
  realtimeEmitter: RealtimeEmitterPort;
  fileStorage: FileStoragePort;
  imageProcessor: ImageProcessorPort;
  otpEmailQueue: OtpEmailQueuePort;
  videoStreamQueue: VideoStreamQueuePort;
  googleOAuthService: GoogleOAuthServicePort;
  s3Service: ObjectStoragePort;
  tokenService: TokenServicePort;
  authService: AuthServicePort;
  userService: UserServicePort;
  friendService: FriendServicePort;
  blockService: BlockServicePort;
  postService: PostServicePort;
  conversationService: ConversationServicePort;
  otpService: OtpServicePort;
  roleService: RoleServicePort;
  hashingService: HashingPort;
  notificationsService: NotificationServicePort;
  twoFactorService: TwoFactorAuthPort;
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
    roleQueryRepository,
    permissionRepository,
    postQueryRepository,
    postCommandRepository,
    userQueryRepository,
    conversationMemberQueryRepository,
    logger,
    cacheManager,
    cacheStrategy,
    realtimeEmitter,
    fileStorage,
    imageProcessor,
    otpEmailQueue,
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

  const authGuard = new AuthGuard(roleQueryRepository, tokenService, cacheStrategy);
  const authOptionGuard = new AuthOptionGuard(tokenService);
  const apiKeyGuard = new ApiKeyGuard(appConfig.auth.apiKey);

  const throttlerGuard = new ThrottlerProxyGuard(appConfig);

  const loggingInterceptor = new LoggingInterceptor(logger);
  const transformResponseInterceptor = new TransformResponseInterceptor();
  const timeoutInterceptor = new TimeoutInterceptor();
  const lookupCacheInterceptor = new CacheInterceptor(cacheManager, {
    ttlSeconds: 60,
    prefix: 'http-cache:lookup'
  });
  const idempotencyInterceptor = new IdempotencyInterceptor(cacheManager);

  const registerUC = new RegisterUseCase(userRepository, hashingService, otpRepository, otpService, roleService);
  const loginEmailUC = new LoginEmailUseCase(userQueryRepository, otpService, hashingService, authService);
  const logoutUC = new LogoutUseCase(refreshTokenRepository);
  const refreshTokenUC = new RefreshTokenUseCase(
    refreshTokenRepository,
    userQueryRepository,
    authService,
    tokenService
  );
  const forgotPasswordUC = new ForgotPasswordUseCase(
    userRepository,
    otpRepository,
    hashingService,
    userService,
    otpService,
    cacheStrategy
  );
  const sendOtpUC = new SendOtpUseCase(otpRepository, userRepository, otpEmailQueue);
  const setup2faUC = new Setup2FAUseCase(userRepository, userService, twoFactorService, cacheStrategy);
  const disable2faUC = new Disable2FAUseCase(userRepository, userService, otpService, cacheStrategy);

  const getGoogleAuthUrlUC = new GetGoogleAuthUrlUseCase(googleOAuthService);
  const loginGoogleUC = new LoginGoogleUseCase(
    googleOAuthService,
    userRepository,
    hashingService,
    roleService,
    authService,
    userService
  );

  const getMeUC = new GetMeUseCase(userService);
  const updateMeUC = new UpdateMeUseCase(userRepository, userService, cacheStrategy);
  const getUserProfileUC = new GetUserProfileUseCase(userService, blockService);
  const changePasswordUC = new ChangePasswordUseCase(userRepository, hashingService, cacheStrategy);

  const blockUserUC = new BlockUserUseCase(
    blockRepository,
    blockService,
    userRepository,
    friendshipRepository,
    friendRequestRepository,
    friendService
  );
  const unblockUserUC = new UnblockUserUseCase(blockRepository, friendService);
  const listBlockedUC = new GetBlockedUserUseCase(blockRepository, userRepository);

  const postAudienceAccessService = new PostAudienceAccessService(
    postQueryRepository,
    blockService,
    userService,
    friendService
  );

  const createBookmarkUC = new BookmarkPostUseCase(bookmarkRepository, postQueryRepository, postAudienceAccessService);
  const unbookmarkPostUC = new UnbookmarkPostUseCase(
    bookmarkRepository,
    postQueryRepository,
    postAudienceAccessService
  );

  const createLikeUC = new LikePostUseCase(likeRepository, postQueryRepository, postAudienceAccessService);
  const unlikeUC = new UnlikePostUseCase(likeRepository, postQueryRepository, postAudienceAccessService);

  const getVideoStatusUC = new GetVideoStatusUseCase(videoStatusRepository);
  const getStaticVideoStreamUC = new GetStaticVideoStreamUseCase(fileStorage);
  const uploadImageUC = new UploadImageUseCase(s3Service, imageProcessor, fileStorage);
  const uploadVideoUC = new UploadVideoUseCase(s3Service, fileStorage);
  const uploadVideoStreamUC = new UploadVideoStreamUseCase(videoStatusRepository, videoStreamQueue, appConfig);

  const getNewFeedsUC = new GetNewFeedsUseCase(postQueryRepository, postService, blockService, friendService, logger);
  const getGuestNewFeedsUC = new GetGuestNewFeedsUseCase(postQueryRepository, postService, logger);
  const increaseViewsUC = new IncreaseViewsUseCase(postCommandRepository);
  const getPostDetailUC = new GetPostDetailUseCase(postQueryRepository, postAudienceAccessService);
  const getPostsTypeUC = new GetPostsTypeUseCase(
    postQueryRepository,
    postAudienceAccessService,
    postService,
    blockService,
    logger
  );
  const createPostUC = new CreatePostUseCase(postRepository, hashtagRepository, blockService, friendService, logger);
  const updatePostUC = new UpdatePostUseCase(postRepository, hashtagRepository, logger);
  const deletePostUC = new DeletePostUseCase(postRepository, roleService);

  const searchPostsUC = new SearchPostsUseCase(postQueryRepository, friendService, postService, blockService);
  const searchUsersUC = new SearchUsersUseCase(userQueryRepository, friendService, cacheStrategy);

  const listFriendsUC = new GetFriendsUseCase(friendshipRepository, userRepository);
  const listIncomingRequestsUC = new GetIncomingRequestsUseCase(friendRequestRepository, userQueryRepository);
  const listOutgoingRequestsUC = new GetOutgoingRequestsUseCase(friendRequestRepository, userQueryRepository);
  const sendFriendRequestUC = new SendFriendRequestUseCase(
    friendshipRepository,
    friendRequestRepository,
    friendService,
    blockRepository,
    userRepository,
    notificationsService
  );
  const acceptIncomingRequestUC = new AcceptIncomingRequestUseCase(
    friendshipRepository,
    friendRequestRepository,
    friendService,
    blockRepository,
    notificationsService
  );
  const declineIncomingRequestUC = new DeclineIncomingRequestUseCase(friendRequestRepository, friendService);
  const revokeOutgoingRequestUC = new RevokeOutgoingRequestUseCase(friendRequestRepository, friendService);
  const unfriendUC = new UnfriendUseCase(friendshipRepository, friendService);

  const createDirectUC = new GetOrCreateConversationUseCase(
    conversationRepository,
    conversationMemberRepository,
    conversationService,
    friendService,
    blockRepository
  );
  const createGroupUC = new CreateGroupUseCase(conversationRepository, friendshipRepository);
  const listConversationsUC = new GetConversationsUseCase(
    conversationRepository,
    conversationMemberRepository,
    conversationMemberQueryRepository,
    conversationService
  );
  const getConversationDetailUC = new GetConversationDetailUseCase(conversationMemberRepository, conversationService);
  const updateConversationUC = new UpdateConversationUseCase(conversationRepository, conversationService);
  const inviteMemberUC = new InviteMemberUseCase(
    conversationRepository,
    conversationMemberRepository,
    conversationService,
    friendService,
    notificationsService
  );
  const kickMemberUC = new KickMemberUseCase(conversationRepository, conversationMemberRepository, conversationService);
  const leaveConversationUC = new LeaveConversationHttpUseCase(conversationMemberRepository, conversationService);
  const updateMemberRoleUC = new UpdateMemberRoleUseCase(conversationMemberRepository, conversationService);
  const transferAdminUC = new TransferAdminUseCase(conversationMemberRepository, conversationService);

  const sendMessageUC = new SendMessageUseCase(
    conversationRepository,
    conversationMemberRepository,
    chatMessageRepository,
    blockRepository,
    notificationsService,
    conversationService,
    realtimeEmitter
  );
  const listMessagesUC = new GetMessagesUseCase(chatMessageRepository, conversationService);
  const markReadUC = new MarkReadUseCase(
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
    updatePostUC,
    deletePostUC,
    createBookmarkUC,
    unbookmarkPostUC,
    createLikeUC,
    unlikeUC
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
  const listNotificationsUC = new ListNotificationsUseCase(notificationRepository, blockRepository);
  const markNotificationsReadUC = new MarkNotificationsReadUseCase(notificationRepository);
  const markNotificationReadUC = new MarkNotificationReadUseCase(notificationRepository);
  const notificationController: INotificationController = new NotificationsController(
    listNotificationsUC,
    markNotificationsReadUC,
    markNotificationReadUC
  );

  const listRolesUC = new ListRolesUseCase(roleRepository);
  const getRoleUC = new GetRoleUseCase(roleRepository);
  const createRoleUC = new CreateRoleUseCase(roleRepository);
  const updateRoleUC = new UpdateRoleUseCase(roleRepository, cacheStrategy);
  const deleteRoleUC = new DeleteRoleUseCase(roleRepository, cacheStrategy);
  const listPermissionsUC = new ListPermissionsUseCase(permissionRepository);

  const getPermissionUC = new GetPermissionUseCase(permissionRepository);
  const createPermissionUC = new CreatePermissionUseCase(permissionRepository);
  const updatePermissionUC = new UpdatePermissionUseCase(permissionRepository, cacheStrategy);
  const deletePermissionUC = new DeletePermissionUseCase(permissionRepository, roleRepository);
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

  const listHashtagsUC = new ListHashtagsUseCase(hashtagRepository);
  const getHashtagUC = new GetHashtagUseCase(hashtagRepository);
  const createHashtagUC = new CreateHashtagUseCase(hashtagRepository);
  const updateHashtagUC = new UpdateHashtagUseCase(hashtagRepository);
  const deleteHashtagUC = new DeleteHashtagUseCase(hashtagRepository);
  const hashtagController: IHashtagController = new HashtagController(
    listHashtagsUC,
    getHashtagUC,
    createHashtagUC,
    updateHashtagUC,
    deleteHashtagUC
  );

  const authPipe: IAuthPipe = new AuthPipe();
  const userPipe: IUserPipe = new UsersPipe(userService);
  const postPipe: IPostPipe = new PostsPipe();
  const searchPipe: ISearchPipe = new SearchPipe();
  const friendPipe: IFriendPipe = new FriendsPipe(userPipe);
  const blocksPipe: IBlockPipe = new BlocksPipe(userPipe);
  const conversationPipe: IConversationPipe = new ConversationsPipe(userPipe);
  const chatMessagePipe: IChatMessagePipe = new ChatMessagesPipe();
  const notificationPipe: INotificationPipe = new NotificationsPipe(userPipe);
  const rolesPipe: IRolesPipe = new RolesPipe();
  const permissionsPipe: IPermissionsPipe = new PermissionsPipe();
  const hashtagsPipe: IHashtagsPipe = new HashtagsPipe();
  const paginationPipe: IPaginationPipe = new PaginationPipe();

  const routers: BaseRoute[] = [
    new AuthRoute(
      authController,
      authPipe,
      authGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor
    ),
    new UserRoute(
      userController,
      userPipe,
      authGuard,
      authOptionGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor,
      idempotencyInterceptor
    ),
    new MediaRoute(
      mediaController,
      userPipe,
      authGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor
    ),
    new OAuthRoute(
      oauthController,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor
    ),
    new PostRoute(
      postController,
      postPipe,
      paginationPipe,
      userPipe,
      authGuard,
      authOptionGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor,
      idempotencyInterceptor
    ),
    new SearchRoute(
      searchController,
      searchPipe,
      paginationPipe,
      userPipe,
      authOptionGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor
    ),
    new FriendRoute(
      friendController,
      friendPipe,
      paginationPipe,
      userPipe,
      authGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor,
      idempotencyInterceptor
    ),
    new BlockRoute(
      blocksController,
      blocksPipe,
      paginationPipe,
      userPipe,
      authGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor,
      idempotencyInterceptor
    ),
    new ConversationRoute(
      conversationController,
      conversationPipe,
      chatMessageController,
      chatMessagePipe,
      paginationPipe,
      userPipe,
      authGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor,
      idempotencyInterceptor
    ),
    new StaticRoute(
      mediaController,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor
    ),
    new NotificationRoute(
      notificationController,
      notificationPipe,
      paginationPipe,
      userPipe,
      authGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor,
      idempotencyInterceptor
    ),
    new RoleRoute(
      roleController,
      rolesPipe,
      paginationPipe,
      authGuard,
      apiKeyGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor,
      lookupCacheInterceptor,
      idempotencyInterceptor
    ),
    new PermissionRoute(
      permissionController,
      permissionsPipe,
      paginationPipe,
      authGuard,
      apiKeyGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor,
      lookupCacheInterceptor,
      idempotencyInterceptor
    ),
    new HashtagRoute(
      hashtagController,
      hashtagsPipe,
      paginationPipe,
      authGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor,
      lookupCacheInterceptor,
      idempotencyInterceptor
    )
  ];

  return routers;
}
