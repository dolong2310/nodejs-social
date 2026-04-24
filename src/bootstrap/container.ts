import { IFileStorage } from '@/application/ports/file-storage.port';
import { IGoogleOAuthService } from '@/application/ports/google-oauth.out-port';
import { IImageProcessor } from '@/application/ports/image-processor.port';
import { LoggerPort } from '@/application/ports/logger.port';
import { IMimeService } from '@/application/ports/mime.port';
import { INotificationTrimQueue } from '@/application/ports/notification-trim-job.port';
import { IPathService } from '@/application/ports/path.port';
import { IPostViewsQueue } from '@/application/ports/post-views-job.port';
import { RealtimePort } from '@/application/ports/realtime.port';
import { RedisPort } from '@/application/ports/redis.port';
import { IS3Service } from '@/application/ports/s3.port';
import { IVideoStreamQueue } from '@/application/ports/video-stream-job.port';
import { ConversationMemberQueryRepositoryPort } from '@/application/queries/conversation-member/conversation-member-query.repository';
import { PostQueryRepositoryPort } from '@/application/queries/post/post-query.repository';
import { UserQueryRepositoryPort } from '@/application/queries/user/user-query.repository';
import { AuthService, IAuthService } from '@/application/services/auth/auth.service';
import { BlockService, IBlockService } from '@/application/services/block/block.service';
import { ConversationService, IConversationService } from '@/application/services/conversation/conversation.service';
import { FriendService, IFriendService } from '@/application/services/friend/friend.service';
import { INotificationsService, NotificationsService } from '@/application/services/notification/notification.service';
import { IOtpService, OtpService } from '@/application/services/otp/otp.service';
import { IPostService, PostService } from '@/application/services/post/post.service';
import { IRoleService, RoleService } from '@/application/services/role/role.service';
import { TokenService } from '@/application/services/token/token.service';
import { ITokenService } from '@/application/services/token/token.service.type';
import { IUserService, UserService } from '@/application/services/user/user.service';
import { appConfig } from '@/bootstrap/config/app.config';
import { buildHttpRouters } from '@/bootstrap/di/http-routes';
import { createContainerQueryRepositories } from '@/bootstrap/di/query-repositories';
import { createContainerQueues } from '@/bootstrap/di/queues';
import { createContainerRepositories } from '@/bootstrap/di/repositories';
import { buildSocketFeatures } from '@/bootstrap/di/socket-features';
import type { IContainer } from '@/bootstrap/di/types';
import { RealtimeEmitter } from '@/bootstrap/realtime-emitter';
import { BlockRepositoryPort } from '@/domain/repositories/block/block.repository';
import { BookmarkRepositoryPort } from '@/domain/repositories/bookmark/bookmark.repository';
import { ChatMessageRepositoryPort } from '@/domain/repositories/chat-message/chat-message.repository';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';
import { ConversationRepositoryPort } from '@/domain/repositories/conversation/conversation.repository';
import { FriendRequestRepositoryPort } from '@/domain/repositories/friend-request/friend-request.repository';
import { FriendshipRepositoryPort } from '@/domain/repositories/friendship/friendship.repository';
import { HashtagRepositoryPort } from '@/domain/repositories/hashtag/hashtag.repository';
import { LikeRepositoryPort } from '@/domain/repositories/like/like.repository';
import { NotificationRepositoryPort } from '@/domain/repositories/notification/notification.repository';
import { OtpRepositoryPort } from '@/domain/repositories/otp/otp.repository';
import { PostRepositoryPort } from '@/domain/repositories/post/post.repository';
import { RefreshTokenRepositoryPort } from '@/domain/repositories/refresh-token/refresh-token.repository';
import { RoleRepositoryPort } from '@/domain/repositories/role/role.repository';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';
import { VideoStatusRepositoryPort } from '@/domain/repositories/video-status/video-status.repository';
import logger from '@/infrastructure/logger/create-logger';
import { Database } from '@/infrastructure/persistence/mongodb/database';
import { Redis } from '@/infrastructure/persistence/redis/redis';
import { TwoFactorAuthenticationService } from '@/infrastructure/services/2fa.service';
import { EmailService, IEmailService } from '@/infrastructure/services/email.service';
import { GoogleOAuthService } from '@/infrastructure/services/google-oauth.service';
import { HashingService } from '@/infrastructure/services/hashing.service';
import { JwtService } from '@/infrastructure/services/jwt.service';
import { S3Service } from '@/infrastructure/services/s3.service';
import { LocalFileStorage } from '@/infrastructure/services/storages/file-storage.service';
import { SharpImageProcessor } from '@/infrastructure/services/storages/image-processor.service';
import { MimeService } from '@/infrastructure/services/storages/mime.service';
import { PathService } from '@/infrastructure/services/storages/path.service';
import { APP_ERROR_MESSAGE } from '@/presentation/http/constants/message.constant';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { ChatFeature } from '@/presentation/socket/chat.feature';
import { PresenceFeature } from '@/presentation/socket/presence.feature';
export type { IContainer } from '@/bootstrap/di/types';

export class Container implements IContainer {
  private static instance: Container | null = null;

  private readonly routers: BaseRoute[];

  private readonly logger: LoggerPort = logger;
  private readonly realtimeEmitter = new RealtimeEmitter();

  private readonly fileStorage: IFileStorage;
  private readonly mimeService: IMimeService;
  private readonly pathService: IPathService;
  private readonly imageProcessor: IImageProcessor;

  private readonly videoStreamQueue: IVideoStreamQueue;
  private readonly notificationTrimQueue: INotificationTrimQueue;
  private readonly postViewsQueue: IPostViewsQueue;

  private readonly userRepository: UserRepositoryPort;
  private readonly refreshTokenRepository: RefreshTokenRepositoryPort;
  private readonly bookmarkRepository: BookmarkRepositoryPort;
  private readonly likeRepository: LikeRepositoryPort;
  private readonly friendshipRepository: FriendshipRepositoryPort;
  private readonly friendRequestRepository: FriendRequestRepositoryPort;
  private readonly blockRepository: BlockRepositoryPort;
  private readonly videoStatusRepository: VideoStatusRepositoryPort;
  private readonly postRepository: PostRepositoryPort;
  private readonly hashtagRepository: HashtagRepositoryPort;
  private readonly conversationRepository: ConversationRepositoryPort;
  private readonly conversationMemberRepository: ConversationMemberRepositoryPort;
  private readonly chatMessageRepository: ChatMessageRepositoryPort;
  private readonly notificationRepository: NotificationRepositoryPort;
  private readonly otpRepository: OtpRepositoryPort;
  private readonly roleRepository: RoleRepositoryPort;

  private readonly postQueryRepository: PostQueryRepositoryPort;
  private readonly userQueryRepository: UserQueryRepositoryPort;
  private readonly conversationMemberQueryRepository: ConversationMemberQueryRepositoryPort;

  private readonly jwtService = new JwtService();
  private readonly tokenService: ITokenService;
  private readonly hashingService = new HashingService();
  private readonly twoFactorService = new TwoFactorAuthenticationService();
  private readonly googleOAuthService: IGoogleOAuthService;

  private readonly s3Service: IS3Service;
  private readonly emailService: IEmailService;

  private readonly redisPort: RedisPort;
  private readonly authService: IAuthService;
  private readonly userService: IUserService;
  private readonly friendService: IFriendService;
  private readonly blockService: IBlockService;
  private readonly postService: IPostService;
  private readonly conversationService: IConversationService;
  private readonly otpService: IOtpService;
  private readonly roleService: IRoleService;
  private readonly notificationsService: INotificationsService;

  private readonly presenceFeature: PresenceFeature;
  private readonly chatFeature: ChatFeature;

  private constructor(mongo: Database, redis: Redis) {
    this.redisPort = redis;

    this.fileStorage = new LocalFileStorage();
    this.mimeService = new MimeService();
    this.pathService = new PathService();
    this.imageProcessor = new SharpImageProcessor();

    const queues = createContainerQueues(this.logger);
    this.videoStreamQueue = queues.videoStreamQueue;
    this.notificationTrimQueue = queues.notificationTrimQueue;
    this.postViewsQueue = queues.postViewsQueue;

    const db = mongo.db;
    const dbClient = mongo.dbClient;
    const log = this.logger;

    const repos = createContainerRepositories(db, dbClient, log);
    this.userRepository = repos.userRepository;
    this.refreshTokenRepository = repos.refreshTokenRepository;
    this.bookmarkRepository = repos.bookmarkRepository;
    this.likeRepository = repos.likeRepository;
    this.friendshipRepository = repos.friendshipRepository;
    this.friendRequestRepository = repos.friendRequestRepository;
    this.blockRepository = repos.blockRepository;
    this.videoStatusRepository = repos.videoStatusRepository;
    this.postRepository = repos.postRepository;
    this.hashtagRepository = repos.hashtagRepository;
    this.conversationRepository = repos.conversationRepository;
    this.conversationMemberRepository = repos.conversationMemberRepository;
    this.chatMessageRepository = repos.chatMessageRepository;
    this.notificationRepository = repos.notificationRepository;
    this.otpRepository = repos.otpRepository;
    this.roleRepository = repos.roleRepository;

    const queryRepos = createContainerQueryRepositories(db, dbClient);
    this.postQueryRepository = queryRepos.postQueryRepository;
    this.userQueryRepository = queryRepos.userQueryRepository;
    this.conversationMemberQueryRepository = queryRepos.conversationMemberQueryRepository;

    this.tokenService = new TokenService(this.jwtService, appConfig);
    this.googleOAuthService = new GoogleOAuthService();
    this.s3Service = new S3Service(this.logger, this.fileStorage, this.mimeService);
    this.emailService = new EmailService(this.logger, this.fileStorage, this.pathService);

    this.authService = new AuthService(this.refreshTokenRepository, this.tokenService);
    this.userService = new UserService(this.userRepository, this.redisPort);
    this.friendService = new FriendService(this.friendshipRepository, this.redisPort);
    this.blockService = new BlockService(this.blockRepository, this.redisPort);
    this.postService = new PostService(this.postQueryRepository, this.postViewsQueue, this.redisPort, this.logger);
    this.conversationService = new ConversationService(this.conversationRepository, this.conversationMemberRepository);
    this.otpService = new OtpService(this.otpRepository, this.twoFactorService);
    this.roleService = new RoleService(this.roleRepository);
    this.notificationsService = new NotificationsService(
      this.notificationRepository,
      this.notificationTrimQueue,
      this.userService,
      this.realtimeEmitter
    );

    this.routers = buildHttpRouters({
      ...repos,
      ...queryRepos,
      logger: this.logger,
      redisPort: this.redisPort,
      realtimeEmitter: this.realtimeEmitter,
      fileStorage: this.fileStorage,
      mimeService: this.mimeService,
      pathService: this.pathService,
      imageProcessor: this.imageProcessor,
      videoStreamQueue: this.videoStreamQueue,
      googleOAuthService: this.googleOAuthService,
      s3Service: this.s3Service,
      tokenService: this.tokenService,
      authService: this.authService,
      userService: this.userService,
      friendService: this.friendService,
      blockService: this.blockService,
      postService: this.postService,
      conversationService: this.conversationService,
      otpService: this.otpService,
      roleService: this.roleService,
      hashingService: this.hashingService,
      notificationsService: this.notificationsService
    });

    const socketFeatures = buildSocketFeatures({
      friendshipRepository: this.friendshipRepository,
      conversationMemberRepository: this.conversationMemberRepository
    });
    this.presenceFeature = socketFeatures.presenceFeature;
    this.chatFeature = socketFeatures.chatFeature;
  }

  public static getOrSet(mongo: Database, redis: Redis): Container {
    if (!Container.instance) {
      Container.instance = new Container(mongo, redis);
    }
    return Container.instance;
  }

  public static get(): Container {
    if (!Container.instance) {
      throw new Error(APP_ERROR_MESSAGE.CONTAINER_INSTANCE_NOT_INITIALIZED);
    }
    return Container.instance;
  }

  public static resetInstance(): void {
    Container.instance = null;
  }

  public getRouters(): BaseRoute[] {
    return this.routers;
  }

  public getSocketDeps() {
    return {
      tokenService: this.tokenService,
      userService: this.userService,
      presenceFeature: this.presenceFeature,
      chatFeature: this.chatFeature
    };
  }

  public getWorkerDeps() {
    return {
      emailService: this.emailService,
      otpRepository: this.otpRepository,
      postRepository: this.postRepository,
      notificationRepository: this.notificationRepository,
      mediaRepository: this.videoStatusRepository,
      s3Service: this.s3Service,
      fileStorage: this.fileStorage,
      mimeService: this.mimeService,
      pathService: this.pathService
    };
  }

  getLogger(): LoggerPort {
    return this.logger;
  }

  public bindRealtimeEmitter(emitter: RealtimePort | null): void {
    this.realtimeEmitter.setEmitter(emitter);
  }
}

export default Container;
