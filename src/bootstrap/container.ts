// Domain
import { IBlockRepository } from '@/domain/repositories/block/block.repository';
import { IBookmarkRepository } from '@/domain/repositories/bookmark/bookmark.repository';
import { IChatMessageRepository } from '@/domain/repositories/chat-message/chat-message.repository';
import { IConversationMemberRepository } from '@/domain/repositories/conversation-member/conversation-member.repository';
import { IConversationRepository } from '@/domain/repositories/conversation/conversation.repository';
import { IFriendRequestRepository } from '@/domain/repositories/friend-request/friend-request.repository';
import { IFriendshipRepository } from '@/domain/repositories/friendship/friendship.repository';
import { ILikeRepository } from '@/domain/repositories/like/like.repository';
import { IMediaRepository } from '@/domain/repositories/media/media.repository';
import { INotificationRepository } from '@/domain/repositories/notification/notification.repository';
import { IPostRepository } from '@/domain/repositories/post/post.repository';
import { IRefreshTokenRepository } from '@/domain/repositories/refresh-token/refresh-token.repository';
import { ISearchRepository } from '@/domain/repositories/search/search.repository';
import { IUserRepository } from '@/domain/repositories/user/user.repository';

// Application
import { APP_ERROR_MESSAGE } from '@/application/common/constants/message.constant';
import { TokenService } from '@/application/common/use-cases/token.service';
import { IAuthService } from '@/application/ports/auth.port';
import { IBlocksService } from '@/application/ports/block.port';
import { IBookmarksService } from '@/application/ports/bookmark.port';
import { IChatMessagesService } from '@/application/ports/chat-message.port';
import { IConversationsService } from '@/application/ports/conversation.port';
import { IEmailQueue } from '@/application/ports/email-job.port';
import { IFileStorage } from '@/application/ports/file-storage.port';
import { IFriendsService } from '@/application/ports/friend.port';
import { IGoogleOAuthService } from '@/application/ports/google-oauth.port';
import { IImageProcessor } from '@/application/ports/image-processor.port';
import { ILikesService } from '@/application/ports/like.port';
import { ILogger } from '@/application/ports/logger.port';
import { IMediaService } from '@/application/ports/media.port';
import { IMimeService } from '@/application/ports/mime.port';
import { INotificationTrimQueue } from '@/application/ports/notification-trim-job.port';
import { INotificationsService, ISocketUserEmitter } from '@/application/ports/notification.port';
import { IOAuthService } from '@/application/ports/oauth.port';
import { IPathService } from '@/application/ports/path.port';
import { IPostViewsQueue } from '@/application/ports/post-views-job.port';
import { IPostsService } from '@/application/ports/post.port';
import { IRealtimeChatEmitter } from '@/application/ports/realtime-emitter.port';
import { IS3Service } from '@/application/ports/s3.port';
import { ISearchService } from '@/application/ports/search.port';
import { ITokenService } from '@/application/ports/token.port';
import { IUsersService } from '@/application/ports/user.port';
import { IVideoHLSQueue } from '@/application/ports/video-hls-job.port';
import { AuthService } from '@/application/use-cases/auth.service';
import { BlocksService } from '@/application/use-cases/block.service';
import { BookmarksService } from '@/application/use-cases/bookmark.service';
import { ChatMessagesService } from '@/application/use-cases/chat-message.service';
import { ConversationsService } from '@/application/use-cases/conversation.service';
import { FriendsService } from '@/application/use-cases/friend.service';
import { LikesService } from '@/application/use-cases/like.service';
import { MediaService } from '@/application/use-cases/media.service';
import { NotificationsService } from '@/application/use-cases/notification.service';
import { OAuthService } from '@/application/use-cases/oauth.service';
import { PostsService } from '@/application/use-cases/post.service';
import { SearchService } from '@/application/use-cases/search.service';
import { UsersService } from '@/application/use-cases/user.service';

// Infrastructure
import logger from '@/infrastructure/logger/create-logger';
import { dbConfig } from '@/infrastructure/persistence/configurations/database.config';
import { BookmarkMapper } from '@/infrastructure/persistence/mapper/bookmark.mapper';
import { ChatMessageMapper } from '@/infrastructure/persistence/mapper/chat-message.mapper';
import { ConversationMemberMapper } from '@/infrastructure/persistence/mapper/conversation-member.mapper';
import { ConversationMapper } from '@/infrastructure/persistence/mapper/conversation.mapper';
import { FriendRequestMapper } from '@/infrastructure/persistence/mapper/friend-request.mapper';
import { FriendshipMapper } from '@/infrastructure/persistence/mapper/friendship.mapper';
import { LikeMapper } from '@/infrastructure/persistence/mapper/like.mapper';
import { VideoStatusMapper } from '@/infrastructure/persistence/mapper/media.mapper';
import { NotificationMapper } from '@/infrastructure/persistence/mapper/notification.mapper';
import { PostMapper } from '@/infrastructure/persistence/mapper/post.mapper';
import { RefreshTokenMapper } from '@/infrastructure/persistence/mapper/refresh-token.mapper';
import { UserMapper } from '@/infrastructure/persistence/mapper/user.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { RedisService } from '@/infrastructure/persistence/redis/redis.service';
import { BlockRepository } from '@/infrastructure/persistence/repositories/blocks.repository';
import { BookmarkRepository } from '@/infrastructure/persistence/repositories/bookmarks.repository';
import { ChatMessageRepository } from '@/infrastructure/persistence/repositories/chat-messages.repository';
import { ConversationMemberRepository } from '@/infrastructure/persistence/repositories/conversation-member.repository';
import { ConversationRepository } from '@/infrastructure/persistence/repositories/conversations.repository';
import { FriendRequestRepository } from '@/infrastructure/persistence/repositories/friend-requests.repository';
import { FriendshipRepository } from '@/infrastructure/persistence/repositories/friendship.repository';
import { LikeRepository } from '@/infrastructure/persistence/repositories/likes.repository';
import { MediaRepository } from '@/infrastructure/persistence/repositories/media.repository';
import { NotificationRepository } from '@/infrastructure/persistence/repositories/notifications.repository';
import { PostRepository } from '@/infrastructure/persistence/repositories/posts.repository';
import { RefreshTokenRepository } from '@/infrastructure/persistence/repositories/refresh-token.repository';
import { SearchRepository } from '@/infrastructure/persistence/repositories/search.repository';
import { UserRepository } from '@/infrastructure/persistence/repositories/users.repository';
import { buildBullMQConnection } from '@/infrastructure/queue/bullmq/bullmq-connection';
import { BullMQEmailQueue } from '@/infrastructure/queue/email/email.queue';
import { BullMQNotificationTrimQueue } from '@/infrastructure/queue/notification-trim/notification-trim.queue';
import { BullMQPostViewsQueue } from '@/infrastructure/queue/post-views/post-views.queue';
import { BullMQVideoHLSQueue } from '@/infrastructure/queue/video-hls/video-hls.queue';
import { EmailService, IEmailService } from '@/infrastructure/services/email.service';
import { GoogleOAuthService } from '@/infrastructure/services/google-oauth.service';
import { S3Service } from '@/infrastructure/services/s3.service';
import { LocalFileStorage } from '@/infrastructure/services/storages/file-storage.service';
import { SharpImageProcessor } from '@/infrastructure/services/storages/image-processor.service';
import { MimeService } from '@/infrastructure/services/storages/mime.service';
import { PathService } from '@/infrastructure/services/storages/path.service';

// Presentation
import { AuthController, IAuthController } from '@/presentation/http/controllers/auth.controller';
import { BlocksController, IBlocksController } from '@/presentation/http/controllers/blocks.controller';
import { BookmarksController, IBookmarksController } from '@/presentation/http/controllers/bookmarks.controller';
import {
  ChatMessagesController,
  IChatMessagesController
} from '@/presentation/http/controllers/chat-messages.controller';
import {
  ConversationsController,
  IConversationsController
} from '@/presentation/http/controllers/conversations.controller';
import { FriendsController, IFriendsController } from '@/presentation/http/controllers/friends.controller';
import { ILikesController, LikesController } from '@/presentation/http/controllers/likes.controller';
import { IMediaController, MediaController } from '@/presentation/http/controllers/media.controller';
import {
  INotificationsController,
  NotificationsController
} from '@/presentation/http/controllers/notifications.controller';
import { IOAuthController, OAuthController } from '@/presentation/http/controllers/oauth.controller';
import { IPostsController, PostsController } from '@/presentation/http/controllers/posts.controller';
import SearchController, { ISearchController } from '@/presentation/http/controllers/search.controller';
import { IUsersController, UsersController } from '@/presentation/http/controllers/users.controller';
import { AuthRoute } from '@/presentation/http/routes/auth.route';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { BlocksRoute } from '@/presentation/http/routes/blocks.route';
import { BookmarksRoute } from '@/presentation/http/routes/bookmarks.route';
import { ConversationsRoute } from '@/presentation/http/routes/conversations.route';
import { FriendsRoute } from '@/presentation/http/routes/friends.route';
import { LikesRoute } from '@/presentation/http/routes/likes.route';
import { MediaRoute } from '@/presentation/http/routes/media.route';
import { NotificationsRoute } from '@/presentation/http/routes/notifications.route';
import { OAuthRoute } from '@/presentation/http/routes/oauth.route';
import { PostsRoute } from '@/presentation/http/routes/posts.route';
import { SearchRoute } from '@/presentation/http/routes/search.route';
import { StaticRoute } from '@/presentation/http/routes/static.route';
import { UsersRoute } from '@/presentation/http/routes/users.route';
import { AuthValidation, IAuthValidation } from '@/presentation/http/validators/auth.validator';
import { BlocksValidation, IBlocksValidation } from '@/presentation/http/validators/blocks.validator';
import {
  ChatMessagesValidation,
  IChatMessagesValidation
} from '@/presentation/http/validators/chat-messages.validator';
import {
  ConversationsValidation,
  IConversationsValidation
} from '@/presentation/http/validators/conversations.validator';
import { FriendsValidation, IFriendsValidation } from '@/presentation/http/validators/friends.validator';
import {
  INotificationsValidation,
  NotificationsValidation
} from '@/presentation/http/validators/notifications.validator';
import { IPostsValidation, PostsValidation } from '@/presentation/http/validators/posts.validator';
import { ISearchValidation, SearchValidation } from '@/presentation/http/validators/search.validator';
import { IUsersValidation, UsersValidation } from '@/presentation/http/validators/users.validator';

// Bootstrap
import { appConfig } from '@/bootstrap/config/app.config';

export interface IContainer {
  getRouters(): BaseRoute[];
  getSocketDeps(): {
    tokenService: ITokenService;
    usersService: IUsersService;
    friendshipRepository: IFriendshipRepository;
    conversationMemberRepository: IConversationMemberRepository;
  };
  getWorkerDeps(): {
    emailService: IEmailService;
    postRepository: IPostRepository;
    notificationRepository: INotificationRepository;
    mediaRepository: IMediaRepository;
    s3Service: IS3Service;
    fileStorage: IFileStorage;
    mimeService: IMimeService;
    pathService: IPathService;
  };
  getTokenService(): ITokenService;
  getLogger(): ILogger;
  bindNotificationsSocket(emitter: ISocketUserEmitter | null): void;
  bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void;
}

export class Container implements IContainer {
  private static instance: Container | null = null;
  private db: DatabaseService;
  private redis: RedisService;

  // Routers
  private routers: BaseRoute[] = [];

  // Logger
  private logger!: ILogger;

  // Storage Services
  private fileStorage!: IFileStorage;
  private mimeService!: IMimeService;
  private pathService!: IPathService;

  // Upload Services
  private imageProcessor!: IImageProcessor;

  // Repositories
  private userRepository!: IUserRepository;
  private refreshTokenRepository!: IRefreshTokenRepository;
  private bookmarkRepository!: IBookmarkRepository;
  private likeRepository!: ILikeRepository;
  private friendshipRepository!: IFriendshipRepository;
  private friendRequestRepository!: IFriendRequestRepository;
  private blockRepository!: IBlockRepository;
  private mediaRepository!: IMediaRepository;
  private postRepository!: IPostRepository;
  private searchRepository!: ISearchRepository;
  private conversationRepository!: IConversationRepository;
  private conversationMemberRepository!: IConversationMemberRepository;
  private chatMessageRepository!: IChatMessageRepository;
  private notificationRepository!: INotificationRepository;

  // Common Services
  private tokenService!: ITokenService;
  private s3Service!: IS3Service;
  private emailService!: IEmailService;

  // Services
  private authService!: IAuthService;
  private usersService!: IUsersService;
  private bookmarksService!: IBookmarksService;
  private likesService!: ILikesService;
  private friendsService!: IFriendsService;
  private blocksService!: IBlocksService;
  private mediaService!: IMediaService;
  private oauthService!: IOAuthService;
  private googleOAuthService!: IGoogleOAuthService;
  private postsService!: IPostsService;
  private searchService!: ISearchService;
  private conversationsService!: IConversationsService;
  private chatMessagesService!: IChatMessagesService;
  private notificationsService!: INotificationsService;

  // Controllers
  private authController!: IAuthController;
  private usersController!: IUsersController;
  private bookmarksController!: IBookmarksController;
  private likesController!: ILikesController;
  private mediaController!: IMediaController;
  private oauthController!: IOAuthController;
  private postsController!: IPostsController;
  private searchController!: ISearchController;
  private friendsController!: IFriendsController;
  private blocksController!: IBlocksController;
  private conversationsController!: IConversationsController;
  private chatMessagesController!: IChatMessagesController;
  private notificationsController!: INotificationsController;

  // Validations
  private authValidation!: IAuthValidation;
  private usersValidation!: IUsersValidation;
  private postsValidation!: IPostsValidation;
  private searchValidation!: ISearchValidation;
  private friendsValidation!: IFriendsValidation;
  private blocksValidation!: IBlocksValidation;
  private conversationsValidation!: IConversationsValidation;
  private chatMessagesValidation!: IChatMessagesValidation;
  private notificationsValidation!: INotificationsValidation;

  // Queues
  private emailQueue!: IEmailQueue;
  private videoHLSQueue!: IVideoHLSQueue;
  private notificationTrimQueue!: INotificationTrimQueue;
  private postViewsQueue!: IPostViewsQueue;

  private constructor(db: DatabaseService, redis: RedisService) {
    this.db = db;
    this.redis = redis;
    this.initializeLogger();
    this.initializeStorageServices();
    this.initializeUploadServices();
    this.initializeQueues();
    this.repositoriesInjection();
    this.servicesInjection();
    this.controllersInjection();
    this.validationsInjection();
    this.routesInjection();
  }

  public static getOrSet(db: DatabaseService, redis: RedisService): Container {
    if (!Container.instance) {
      Container.instance = new Container(db, redis);
    }
    return Container.instance;
  }

  public static get(): Container {
    if (!Container.instance) {
      throw new Error(APP_ERROR_MESSAGE.CONTAINER_INSTANCE_NOT_INITIALIZED);
    }
    return Container.instance;
  }

  // This can be useful for testing purposes or when you need to reinitialize the container
  public static resetInstance(): void {
    Container.instance = null;
  }

  private initializeLogger(): void {
    this.logger = logger;
  }

  private initializeStorageServices(): void {
    this.fileStorage = new LocalFileStorage();
    this.mimeService = new MimeService();
    this.pathService = new PathService();
  }

  private initializeUploadServices(): void {
    this.imageProcessor = new SharpImageProcessor();
    // this.fileUploadService = new FormidableFileUploadService();
  }

  private repositoriesInjection(): void {
    const userMapper = new UserMapper();
    const refreshTokenMapper = new RefreshTokenMapper();
    const bookmarkMapper = new BookmarkMapper();
    const likeMapper = new LikeMapper();
    const friendshipMapper = new FriendshipMapper();
    const friendRequestMapper = new FriendRequestMapper();
    const videoStatusMapper = new VideoStatusMapper();
    const postMapper = new PostMapper();
    const conversationMapper = new ConversationMapper();
    const conversationMemberMapper = new ConversationMemberMapper();
    const chatMessageMapper = new ChatMessageMapper();
    const notificationMapper = new NotificationMapper();

    this.userRepository = new UserRepository(this.db, userMapper);
    this.refreshTokenRepository = new RefreshTokenRepository(this.db, refreshTokenMapper);
    this.bookmarkRepository = new BookmarkRepository(this.db, bookmarkMapper);
    this.likeRepository = new LikeRepository(this.db, likeMapper);
    this.friendshipRepository = new FriendshipRepository(this.db, friendshipMapper);
    this.friendRequestRepository = new FriendRequestRepository(this.db, friendRequestMapper);
    this.blockRepository = new BlockRepository(this.db);
    this.mediaRepository = new MediaRepository(this.db, videoStatusMapper);
    this.postRepository = new PostRepository(this.db, postMapper);
    this.searchRepository = new SearchRepository(this.db);
    this.conversationRepository = new ConversationRepository(this.db, conversationMapper, conversationMemberMapper);
    this.conversationMemberRepository = new ConversationMemberRepository(this.db, conversationMemberMapper);
    this.chatMessageRepository = new ChatMessageRepository(this.db, chatMessageMapper);
    this.notificationRepository = new NotificationRepository(this.db, notificationMapper);
  }

  private servicesInjection(): void {
    // Common Services
    this.tokenService = new TokenService(appConfig);
    this.s3Service = new S3Service(this.logger, this.fileStorage, this.mimeService);
    this.emailService = new EmailService(this.logger, this.fileStorage, this.pathService);

    // Services
    this.authService = new AuthService(
      this.userRepository,
      this.refreshTokenRepository,
      this.tokenService,
      this.emailQueue,
      this.redis
    );
    this.usersService = new UsersService(this.userRepository, this.blockRepository, this.redis);
    this.bookmarksService = new BookmarksService(this.bookmarkRepository);
    this.likesService = new LikesService(this.likeRepository);
    this.notificationsService = new NotificationsService(
      this.notificationRepository,
      this.userRepository,
      this.blockRepository,
      this.notificationTrimQueue
    );
    this.friendsService = new FriendsService(
      this.friendshipRepository,
      this.friendRequestRepository,
      this.blockRepository,
      this.redis,
      this.userRepository,
      this.notificationsService
    );
    this.blocksService = new BlocksService(
      this.blockRepository,
      this.userRepository,
      this.friendshipRepository,
      this.friendRequestRepository,
      this.friendsService
    );
    this.mediaService = new MediaService(
      this.mediaRepository,
      this.s3Service,
      this.videoHLSQueue,
      this.imageProcessor,
      this.fileStorage,
      this.mimeService,
      this.pathService,
      appConfig
    );
    this.googleOAuthService = new GoogleOAuthService();
    this.oauthService = new OAuthService(this.googleOAuthService, this.authService, this.usersService);
    this.postsService = new PostsService(
      this.postRepository,
      this.blockRepository,
      this.friendsService,
      this.postViewsQueue,
      this.redis,
      this.logger
    );
    this.searchService = new SearchService(this.searchRepository, this.friendsService, this.postsService, this.redis);
    this.conversationsService = new ConversationsService(
      this.conversationRepository,
      this.conversationMemberRepository,
      this.friendsService,
      this.blockRepository,
      this.notificationsService
    );
    this.chatMessagesService = new ChatMessagesService(
      this.conversationRepository,
      this.conversationMemberRepository,
      this.chatMessageRepository,
      this.blockRepository,
      this.notificationsService
    );
  }

  private controllersInjection(): void {
    this.authController = new AuthController(this.authService);
    this.usersController = new UsersController(this.usersService);
    this.bookmarksController = new BookmarksController(this.bookmarksService);
    this.likesController = new LikesController(this.likesService);
    this.mediaController = new MediaController(this.mediaService, this.s3Service, this.fileStorage, this.pathService);
    this.oauthController = new OAuthController(this.oauthService);
    this.postsController = new PostsController(this.postsService);
    this.searchController = new SearchController(this.searchService);
    this.friendsController = new FriendsController(this.friendsService);
    this.blocksController = new BlocksController(this.blocksService);
    this.conversationsController = new ConversationsController(this.conversationsService);
    this.chatMessagesController = new ChatMessagesController(this.chatMessagesService);
    this.notificationsController = new NotificationsController(this.notificationsService);
  }

  private validationsInjection(): void {
    this.authValidation = new AuthValidation(this.tokenService);
    this.usersValidation = new UsersValidation(this.usersService);
    this.postsValidation = new PostsValidation(
      this.postsService,
      this.usersService,
      this.friendsService,
      this.blockRepository
    );
    this.searchValidation = new SearchValidation();
    this.friendsValidation = new FriendsValidation(this.usersValidation);
    this.blocksValidation = new BlocksValidation(this.usersValidation);
    this.conversationsValidation = new ConversationsValidation(this.usersValidation);
    this.chatMessagesValidation = new ChatMessagesValidation();
    this.notificationsValidation = new NotificationsValidation(this.usersValidation);
  }

  private routesInjection(): void {
    this.routers.push(
      new AuthRoute(this.authController, this.authValidation, this.usersValidation),
      new UsersRoute(this.usersController, this.usersValidation),
      new BookmarksRoute(this.bookmarksController, this.usersValidation, this.postsValidation),
      new LikesRoute(this.likesController, this.usersValidation, this.postsValidation),
      new MediaRoute(this.mediaController, this.usersValidation),
      new OAuthRoute(this.oauthController),
      new PostsRoute(this.postsController, this.postsValidation, this.usersValidation),
      new SearchRoute(this.searchController, this.searchValidation),
      new FriendsRoute(this.friendsController, this.friendsValidation, this.usersValidation),
      new BlocksRoute(this.blocksController, this.blocksValidation, this.usersValidation),
      new ConversationsRoute(
        this.conversationsController,
        this.conversationsValidation,
        this.chatMessagesController,
        this.chatMessagesValidation,
        this.usersValidation
      ),
      new StaticRoute(this.mediaController),
      new NotificationsRoute(this.notificationsController, this.notificationsValidation, this.usersValidation)
    );
  }

  private initializeQueues(): void {
    const connection = buildBullMQConnection(dbConfig.redis);
    this.emailQueue = new BullMQEmailQueue(connection, this.logger);
    this.videoHLSQueue = new BullMQVideoHLSQueue(connection, this.logger);
    this.notificationTrimQueue = new BullMQNotificationTrimQueue(connection, this.logger);
    this.postViewsQueue = new BullMQPostViewsQueue(connection, this.logger);
  }

  public getRouters(): BaseRoute[] {
    return this.routers;
  }

  public getSocketDeps() {
    return {
      tokenService: this.tokenService,
      usersService: this.usersService,
      friendshipRepository: this.friendshipRepository,
      conversationMemberRepository: this.conversationMemberRepository
    };
  }

  public getWorkerDeps() {
    return {
      emailService: this.emailService,
      postRepository: this.postRepository,
      notificationRepository: this.notificationRepository,
      mediaRepository: this.mediaRepository,
      s3Service: this.s3Service,
      fileStorage: this.fileStorage,
      mimeService: this.mimeService,
      pathService: this.pathService
    };
  }

  public getTokenService(): ITokenService {
    return this.tokenService;
  }

  getLogger(): ILogger {
    return this.logger;
  }

  // Bindings
  public bindNotificationsSocket(emitter: ISocketUserEmitter | null): void {
    this.notificationsService.bindSocketEmitter(emitter);
  }

  public bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void {
    this.chatMessagesService.bindRealtimeChatEmitter(emitter);
  }
}

export default Container;
