import { IFileStorage } from '@/application/ports/file-storage.port';
import { IGoogleOAuthService } from '@/application/ports/google-oauth.out-port';
import { IHashingService } from '@/application/ports/hashing.port';
import { IImageProcessor } from '@/application/ports/image-processor.port';
import { LoggerPort } from '@/application/ports/logger.port';
import { IMimeService } from '@/application/ports/mime.port';
import { IPathService } from '@/application/ports/path.port';
import { RedisPort } from '@/application/ports/redis.port';
import { IS3Service } from '@/application/ports/s3.port';
import { IVideoStreamQueue } from '@/application/ports/video-stream-job.port';
import { IAuthService } from '@/application/services/auth/auth.service';
import { IBlockService } from '@/application/services/block/block.service';
import { IConversationService } from '@/application/services/conversation/conversation.service';
import { IFriendService } from '@/application/services/friend/friend.service';
import { INotificationsService } from '@/application/services/notification/notification.service';
import { IOtpService } from '@/application/services/otp/otp.service';
import { IPostService } from '@/application/services/post/post.service';
import { IRoleService } from '@/application/services/role/role.service';
import { ITokenService } from '@/application/services/token/token.service.type';
import { IUserService } from '@/application/services/user/user.service';
import { ForgotPasswordInteractor } from '@/application/use-cases/auth/forgot-password/forgot-password.interactor';
import { GetGoogleAuthUrlInteractor } from '@/application/use-cases/auth/get-google-auth-url/get-google-auth-url.interactor';
import { LoginEmailInteractor } from '@/application/use-cases/auth/login-email/login-email.interactor';
import { LoginGoogleInteractor } from '@/application/use-cases/auth/login-google/login-google.interactor';
import { LogoutInteractor } from '@/application/use-cases/auth/logout/logout.interactor';
import { RefreshTokenInteractor } from '@/application/use-cases/auth/refresh-token/refresh-token.interactor';
import { RegisterInteractor } from '@/application/use-cases/auth/register/register.interactor';
import { BlockUserInteractor } from '@/application/use-cases/block/block-user/block-user.interactor';
import { GetBlockedUserInteractor } from '@/application/use-cases/block/get-blocked-user/get-blocked-user.interactor';
import { UnblockUserInteractor } from '@/application/use-cases/block/unblock-user/unblock-user.interactor';
import { BookmarkPostInteractor } from '@/application/use-cases/bookmark/bookmark-post/bookmark-post.interactor';
import { UnbookmarkPostInteractor } from '@/application/use-cases/bookmark/unbookmark-post/unbookmark-post.interactor';
import { GetMessagesInteractor } from '@/application/use-cases/chat-message/get-messages/get-messages.interactor';
import { MarkReadInteractor } from '@/application/use-cases/chat-message/mark-read/mark-read.interactor';
import { SendMessageInteractor } from '@/application/use-cases/chat-message/send-message/send-message.interactor';
import { CreateGroupInteractor } from '@/application/use-cases/conversation/create-group/create-group.interactor';
import { GetConversationDetailInteractor } from '@/application/use-cases/conversation/get-conversation-detail/get-conversation-detail.interactor';
import { GetConversationsInteractor } from '@/application/use-cases/conversation/get-conversations/get-conversations.interactor';
import { GetOrCreateConversationInteractor } from '@/application/use-cases/conversation/get-or-create-conversation/get-or-create-conversation.interactor';
import { InviteMemberInteractor } from '@/application/use-cases/conversation/invite-member/invite-member.interactor';
import { KickMemberInteractor } from '@/application/use-cases/conversation/kick-member/kick-member.interactor';
import { LeaveConversationInteractor as LeaveConversationHttpInteractor } from '@/application/use-cases/conversation/leave-conversation/leave-conversation.interactor';
import { TransferAdminInteractor } from '@/application/use-cases/conversation/transfer-admin/transfer-admin.interactor';
import { UpdateConversationInteractor } from '@/application/use-cases/conversation/update-conversation/update-conversation.interactor';
import { UpdateMemberRoleInteractor } from '@/application/use-cases/conversation/update-member-role/update-member-role.interactor';
import { AcceptIncomingRequestInteractor } from '@/application/use-cases/friend/accept-incoming-request/accept-incoming-request.interactor';
import { DeclineIncomingRequestInteractor } from '@/application/use-cases/friend/decline-incoming-request/decline-incoming-request.interactor';
import { GetFriendsInteractor } from '@/application/use-cases/friend/get-friends/get-friends.interactor';
import { GetIncomingRequestsInteractor } from '@/application/use-cases/friend/get-incoming-requests/get-incoming-requests.interactor';
import { GetOutgoingRequestsInteractor } from '@/application/use-cases/friend/get-outgoing-requests/get-outgoing-requests.interactor';
import { RevokeOutgoingRequestInteractor } from '@/application/use-cases/friend/revoke-outgoing-request/revoke-outgoing-request.interactor';
import { SendFriendRequestInteractor } from '@/application/use-cases/friend/send-friend-request/send-friend-request.interactor';
import { UnfriendInteractor } from '@/application/use-cases/friend/unfriend/unfriend.interactor';
import { LikePostInteractor } from '@/application/use-cases/like/like-post/like-post.interactor';
import { UnlikePostInteractor } from '@/application/use-cases/like/unlike-post/unlike-post.interactor';
import { GetStaticVideoStreamInteractor } from '@/application/use-cases/media/get-static-video-stream/get-static-video-stream.interactor';
import { GetVideoStatusInteractor } from '@/application/use-cases/media/get-video-status/get-video-status.interactor';
import { UploadImageInteractor } from '@/application/use-cases/media/upload-image/upload-image.interactor';
import { UploadVideoStreamInteractor } from '@/application/use-cases/media/upload-video-stream/upload-video-stream.interactor';
import { UploadVideoInteractor } from '@/application/use-cases/media/upload-video/upload-video.interactor';
import { ListNotificationsInteractor } from '@/application/use-cases/notification/list-notifications/list-notifications.interactor';
import { MarkNotificationReadInteractor } from '@/application/use-cases/notification/mark-notification-read/mark-notification-read.interactor';
import { MarkNotificationsReadInteractor } from '@/application/use-cases/notification/mark-notifications-read/mark-notifications-read.interactor';
import { CreatePostInteractor } from '@/application/use-cases/post/create-post/create-post.interactor';
import { GetGuestNewFeedsInteractor } from '@/application/use-cases/post/get-guest-new-feeds/get-guest-new-feeds.interactor';
import { GetNewFeedsInteractor } from '@/application/use-cases/post/get-new-feeds/get-new-feeds.interactor';
import { GetPostsTypeInteractor } from '@/application/use-cases/post/get-posts-type/get-posts-type.interactor';
import { IncreaseViewsInteractor } from '@/application/use-cases/post/increase-views/increase-views.interactor';
import { UpdatePostInteractor } from '@/application/use-cases/post/update-post/update-post.interactor';
import { SearchPostsInteractor } from '@/application/use-cases/search/search-posts/search-posts.interactor';
import { SearchUsersInteractor } from '@/application/use-cases/search/search-users/search-users.interactor';
import { ChangePasswordInteractor } from '@/application/use-cases/user/change-password/change-password.interactor';
import { GetMeInteractor } from '@/application/use-cases/user/get-me/get-me.interactor';
import { GetUserProfileInteractor } from '@/application/use-cases/user/get-user-profile/get-user-profile.interactor';
import { UpdateMeInteractor } from '@/application/use-cases/user/update-me/update-me.interactor';
import { appConfig } from '@/bootstrap/config/app.config';
import { ContainerQueryRepositories } from '@/bootstrap/di/query-repositories';
import { ContainerRepositories } from '@/bootstrap/di/repositories';
import { RealtimeEmitter } from '@/bootstrap/realtime-emitter';
import { AuthController, IAuthController } from '@/presentation/http/controllers/auth.controller';
import { BlockController, IBlockController } from '@/presentation/http/controllers/block.controller';
import { BookmarkController, IBookmarkController } from '@/presentation/http/controllers/bookmark.controller';
import { ChatMessageController, IChatMessageController } from '@/presentation/http/controllers/chat-message.controller';
import {
  ConversationController,
  IConversationController
} from '@/presentation/http/controllers/conversation.controller';
import { FriendController, IFriendController } from '@/presentation/http/controllers/friend.controller';
import { ILikeController, LikeController } from '@/presentation/http/controllers/like.controller';
import { IMediaController, MediaController } from '@/presentation/http/controllers/media.controller';
import {
  INotificationController,
  NotificationsController
} from '@/presentation/http/controllers/notifications.controller';
import { IOAuthController, OAuthController } from '@/presentation/http/controllers/oauth.controller';
import { IPostController, PostController } from '@/presentation/http/controllers/post.controller';
import { ISearchController, SearchController } from '@/presentation/http/controllers/search.controller';
import { IUserController, UserController } from '@/presentation/http/controllers/users.controller';
import { AuthRoute } from '@/presentation/http/routes/auth.route';
import { BaseRoute } from '@/presentation/http/routes/base.route';
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
import { AuthValidator, IAuthValidator } from '@/presentation/http/validators/auth.validator';
import { BlocksValidator, IBlockValidator } from '@/presentation/http/validators/block.validator';
import { ChatMessagesValidator, IChatMessageValidator } from '@/presentation/http/validators/chat-message.validator';
import { ConversationsValidator, IConversationValidator } from '@/presentation/http/validators/conversation.validator';
import { FriendsValidator, IFriendValidator } from '@/presentation/http/validators/friend.validator';
import { INotificationValidator, NotificationsValidator } from '@/presentation/http/validators/notification.validator';
import { IPostValidator, PostsValidator } from '@/presentation/http/validators/post.validator';
import { ISearchValidator, SearchValidator } from '@/presentation/http/validators/search.validator';
import { IUserValidator, UsersValidator } from '@/presentation/http/validators/user.validator';

export type HttpContext = ContainerRepositories &
  ContainerQueryRepositories & {
    logger: LoggerPort;
    redisPort: RedisPort;
    realtimeEmitter: RealtimeEmitter;
    fileStorage: IFileStorage;
    mimeService: IMimeService;
    pathService: IPathService;
    imageProcessor: IImageProcessor;
    videoStreamQueue: IVideoStreamQueue;
    googleOAuthService: IGoogleOAuthService;
    s3Service: IS3Service;
    tokenService: ITokenService;
    authService: IAuthService;
    userService: IUserService;
    friendService: IFriendService;
    blockService: IBlockService;
    postService: IPostService;
    conversationService: IConversationService;
    otpService: IOtpService;
    roleService: IRoleService;
    hashingService: IHashingService;
    notificationsService: INotificationsService;
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
    postQueryRepository,
    userQueryRepository,
    conversationMemberQueryRepository,
    logger,
    redisPort,
    realtimeEmitter,
    fileStorage,
    mimeService,
    pathService,
    imageProcessor,
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
    notificationsService
  } = ctx;

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
    redisPort,
    otpRepository,
    hashingService,
    userService,
    otpService
  );

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
  const updateMeUC = new UpdateMeInteractor(userRepository, userService, redisPort);
  const getUserProfileUC = new GetUserProfileInteractor(userService, blockService);
  const changePasswordUC = new ChangePasswordInteractor(userRepository, hashingService, redisPort);

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

  const createBookmarkUC = new BookmarkPostInteractor(bookmarkRepository);
  const unbookmarkPostUC = new UnbookmarkPostInteractor(bookmarkRepository);

  const createLikeUC = new LikePostInteractor(likeRepository);
  const unlikeUC = new UnlikePostInteractor(likeRepository);

  const getVideoStatusUC = new GetVideoStatusInteractor(videoStatusRepository);
  const getStaticVideoStreamUC = new GetStaticVideoStreamInteractor(fileStorage, mimeService, pathService);
  const uploadImageUC = new UploadImageInteractor(s3Service, imageProcessor, fileStorage, mimeService, pathService);
  const uploadVideoUC = new UploadVideoInteractor(s3Service, fileStorage, mimeService);
  const uploadVideoStreamUC = new UploadVideoStreamInteractor(videoStatusRepository, videoStreamQueue, appConfig);

  const getNewFeedsUC = new GetNewFeedsInteractor(
    postQueryRepository,
    postService,
    blockService,
    friendService,
    logger
  );
  const getGuestNewFeedsUC = new GetGuestNewFeedsInteractor(postQueryRepository, postService, logger);
  const increaseViewsUC = new IncreaseViewsInteractor(postRepository);
  const getPostsTypeUC = new GetPostsTypeInteractor(postQueryRepository, postService, blockService, logger);
  const createPostUC = new CreatePostInteractor(postRepository, hashtagRepository, blockService, friendService, logger);
  const updatePostUC = new UpdatePostInteractor(postRepository, logger);

  const searchPostsUC = new SearchPostsInteractor(postQueryRepository, friendService, postService, blockService);
  const searchUsersUC = new SearchUsersInteractor(userQueryRepository, friendService, redisPort);

  const listFriendsUC = new GetFriendsInteractor(friendshipRepository, userRepository);
  const listIncomingRequestsUC = new GetIncomingRequestsInteractor(friendRequestRepository, userRepository);
  const listOutgoingRequestsUC = new GetOutgoingRequestsInteractor(friendRequestRepository, userRepository);
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
    forgotPasswordUC
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
    fileStorage,
    pathService
  );
  const oauthController: IOAuthController = new OAuthController(getGoogleAuthUrlUC, loginGoogleUC);
  const postController: IPostController = new PostController(
    getNewFeedsUC,
    getGuestNewFeedsUC,
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

  const authValidator: IAuthValidator = new AuthValidator();
  const userValidator: IUserValidator = new UsersValidator(userService);
  const postValidator: IPostValidator = new PostsValidator(
    postQueryRepository,
    blockRepository,
    userService,
    friendService
  );
  const searchValidator: ISearchValidator = new SearchValidator();
  const friendValidator: IFriendValidator = new FriendsValidator(userValidator);
  const blocksValidator: IBlockValidator = new BlocksValidator(userValidator);
  const conversationValidator: IConversationValidator = new ConversationsValidator(userValidator);
  const chatMessageValidator: IChatMessageValidator = new ChatMessagesValidator();
  const notificationValidator: INotificationValidator = new NotificationsValidator(userValidator);

  const routers: BaseRoute[] = [
    new AuthRoute(authController, authValidator),
    new UserRoute(userController, userValidator),
    new BookmarkRoute(bookmarkController, userValidator, postValidator),
    new LikeRoute(likeController, userValidator, postValidator),
    new MediaRoute(mediaController, userValidator),
    new OAuthRoute(oauthController),
    new PostRoute(postController, postValidator, userValidator),
    new SearchRoute(searchController, searchValidator),
    new FriendRoute(friendController, friendValidator, userValidator),
    new BlockRoute(blocksController, blocksValidator, userValidator),
    new ConversationRoute(
      conversationController,
      conversationValidator,
      chatMessageController,
      chatMessageValidator,
      userValidator
    ),
    new StaticRoute(mediaController),
    new NotificationRoute(notificationController, notificationValidator, userValidator)
  ];

  return routers;
}
