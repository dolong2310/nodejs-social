import { appConfig } from '@/bootstrap/config/app.config';
import { buildHttpRouters } from '@/bootstrap/di/http-routes';
import { createContainerQueues } from '@/bootstrap/di/queues';
import { createContainerRepositories } from '@/bootstrap/di/repositories';
import { buildSocketFeatures } from '@/bootstrap/di/socket-features';
import type { IContainer } from '@/bootstrap/di/types';
// import { SesEmailSender } from '@/infrastructure/email/ses-email-sender';
import { ResendEmailSender } from '@/infrastructure/email/resend-email-sender';
import logger from '@/infrastructure/logger/create-logger';
import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import { CacheManager } from '@/infrastructure/persistence/redis/cache-manager';
import { RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';
import { TwoFactorAuthPort } from '@/modules/authentication/application/ports/2fa.port';
import { GoogleOAuthServicePort } from '@/modules/authentication/application/ports/google-oauth.port';
import { JwtPort } from '@/modules/authentication/application/ports/jwt.port';
import { OtpEmailQueuePort } from '@/modules/authentication/application/ports/otp-email-job.port';
import { AuthService, AuthServicePort } from '@/modules/authentication/application/services/auth.service';
import { OtpService, OtpServicePort } from '@/modules/authentication/application/services/otp.service';
import { TokenService } from '@/modules/authentication/application/services/token.service';
import { TokenServicePort } from '@/modules/authentication/application/services/token.service.types';
import { DeleteExpiredOtpsPort } from '@/modules/authentication/application/use-cases/delete-expired-otps/delete-expired-otps.port';
import { DeleteExpiredOtpsUseCase } from '@/modules/authentication/application/use-cases/delete-expired-otps/delete-expired-otps.usecase';
import { DeleteExpiredRefreshTokensPort } from '@/modules/authentication/application/use-cases/delete-expired-refresh-tokens/delete-expired-refresh-tokens.port';
import { DeleteExpiredRefreshTokensUseCase } from '@/modules/authentication/application/use-cases/delete-expired-refresh-tokens/delete-expired-refresh-tokens.usecase';
import { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import { RefreshTokenRepositoryPort } from '@/modules/authentication/domain/repositories/refresh-token.repository';
import { TwoFactorAuthService } from '@/modules/authentication/infrastructure/services/2fa.service';
import { GoogleOAuthService } from '@/modules/authentication/infrastructure/services/google-oauth.service';
import { HashingService } from '@/modules/authentication/infrastructure/services/hashing.service';
import { JwtService } from '@/modules/authentication/infrastructure/services/jwt.service';
import { RoleService, RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { RoleQueryRepositoryPort } from '@/modules/authorization/domain/repositories/role.query.repository';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import {
  ConversationService,
  ConversationServicePort
} from '@/modules/conversation/application/services/conversation.service';
import { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';
import { ConversationMemberQueryRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.query.repository';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { EmailSenderPort } from '@/modules/core/application/ports/email-sender.port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { RealtimeEmitterPort } from '@/modules/core/application/ports/realtime-emitter.port';
import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { ImageProcessorPort } from '@/modules/media/application/ports/image-processor.port';
import { ObjectStoragePort } from '@/modules/media/application/ports/object-storage.port';
import { VideoStreamQueuePort } from '@/modules/media/application/ports/video-stream-job.port';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import { CloudinaryService } from '@/modules/media/infrastructure/services/cloudinary-storage.service';
import { LocalFileStorage } from '@/modules/media/infrastructure/services/file-storage.service';
// import { S3Service } from '@/modules/media/infrastructure/services/s3-storage.service';
import { SharpImageProcessor } from '@/modules/media/infrastructure/services/sharp-image-processor.service';
import { NotificationTrimQueuePort } from '@/modules/notification/application/ports/notification-trim-job.port';
import {
  NotificationService,
  NotificationServicePort
} from '@/modules/notification/application/services/notification.service';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import { CheckSystemHealthPort } from '@/modules/operations/application/use-cases/check-system-health/check-system-health.port';
import { CheckSystemHealthUseCase } from '@/modules/operations/application/use-cases/check-system-health/check-system-health.usecase';
import { WarmRedisCacheUseCase } from '@/modules/operations/application/use-cases/warm-redis-cache/warm-redis-cache.usecase';
import { NodeSystemHealthProbe } from '@/modules/operations/infrastructure/system/node-system-health-probe';
import { PostViewsQueuePort } from '@/modules/post/application/ports/post-views-job.port';
import { PostService, PostServicePort } from '@/modules/post/application/services/post.service';
import { BookmarkRepositoryPort } from '@/modules/post/domain/repositories/bookmark.repository';
import { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';
import { LikeRepositoryPort } from '@/modules/post/domain/repositories/like.repository';
import { PostCommandRepositoryPort } from '@/modules/post/domain/repositories/post.command.repository';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import { BlockService, BlockServicePort } from '@/modules/relationship/application/services/block.service';
import { FriendService, FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';
import { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';
import { UserService, UserServicePort } from '@/modules/user/application/services/user.service';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { APP_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { ChatFeature } from '@/presentation/socket/features/chat.feature';
import { PresenceFeature } from '@/presentation/socket/features/presence.feature';
import { RealtimeEmitter } from '@/presentation/socket/realtime-emitter';
import { type Server as SocketServer } from 'socket.io';
export type { IContainer } from '@/bootstrap/di/types';

export class Container implements IContainer {
  private static instance: Container | null = null;

  private readonly routers: BaseRoute[];

  private readonly database: DatabasePort;
  private readonly redis: RedisClientPort;
  private readonly socket: SocketServer;
  private readonly cacheManager: CacheManagerPort;
  private readonly logger: LoggerPort = logger;

  private readonly realtimeEmitter: RealtimeEmitterPort;

  private readonly fileStorage: FileStoragePort;
  private readonly imageProcessor: ImageProcessorPort;

  private readonly otpEmailQueue: OtpEmailQueuePort;
  private readonly videoStreamQueue: VideoStreamQueuePort;
  private readonly notificationTrimQueue: NotificationTrimQueuePort;
  private readonly postViewsQueue: PostViewsQueuePort;

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
  private readonly postCommandRepository: PostCommandRepositoryPort;
  private readonly userQueryRepository: UserQueryRepositoryPort;
  private readonly conversationMemberQueryRepository: ConversationMemberQueryRepositoryPort;
  private readonly roleQueryRepository: RoleQueryRepositoryPort;

  private readonly jwtService: JwtPort;
  private readonly tokenService: TokenServicePort;
  private readonly hashingService: HashingPort;
  private readonly twoFactorService: TwoFactorAuthPort;
  private readonly googleOAuthService: GoogleOAuthServicePort;

  private readonly s3Service: ObjectStoragePort;
  private readonly emailSender: EmailSenderPort;

  private readonly authService: AuthServicePort;
  private readonly userService: UserServicePort;
  private readonly friendService: FriendServicePort;
  private readonly blockService: BlockServicePort;
  private readonly postService: PostServicePort;
  private readonly conversationService: ConversationServicePort;
  private readonly otpService: OtpServicePort;
  private readonly roleService: RoleServicePort;
  private readonly notificationsService: NotificationServicePort;
  private readonly deleteExpiredOtpsUC: DeleteExpiredOtpsPort;
  private readonly deleteExpiredRefreshTokensUC: DeleteExpiredRefreshTokensPort;
  private readonly warmRedisCacheUC: WarmRedisCacheUseCase;
  private readonly checkSystemHealthUC: CheckSystemHealthPort;

  private readonly presenceFeature: PresenceFeature;
  private readonly chatFeature: ChatFeature;

  private constructor(database: DatabasePort, redis: RedisClientPort, socket: SocketServer) {
    this.database = database;
    this.redis = redis;
    this.socket = socket;

    this.cacheManager = new CacheManager(this.redis);
    this.jwtService = new JwtService();
    this.hashingService = new HashingService();
    this.twoFactorService = new TwoFactorAuthService();
    this.fileStorage = new LocalFileStorage();
    this.imageProcessor = new SharpImageProcessor();
    this.realtimeEmitter = new RealtimeEmitter(socket);

    const queues = createContainerQueues(this.logger);
    this.otpEmailQueue = queues.otpEmailQueue;
    this.videoStreamQueue = queues.videoStreamQueue;
    this.notificationTrimQueue = queues.notificationTrimQueue;
    this.postViewsQueue = queues.postViewsQueue;

    const repos = createContainerRepositories(this.database, this.logger);
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
    this.roleQueryRepository = repos.roleQueryRepository;

    this.postQueryRepository = repos.postQueryRepository;
    this.postCommandRepository = repos.postCommandRepository;
    this.userQueryRepository = repos.userQueryRepository;
    this.conversationMemberQueryRepository = repos.conversationMemberQueryRepository;

    this.tokenService = new TokenService(this.jwtService, {
      algorithm: appConfig.jwt.algorithm,
      accessTokenSecret: appConfig.jwt.accessTokenSecret,
      refreshTokenSecret: appConfig.jwt.refreshTokenSecret,
      accessTokenExpiresIn: appConfig.jwt.accessTokenExpiresIn,
      refreshTokenExpiresIn: appConfig.jwt.refreshTokenExpiresIn
    });
    this.googleOAuthService = new GoogleOAuthService({
      clientId: appConfig.google.clientId,
      clientSecret: appConfig.google.clientSecret,
      redirectUri: appConfig.google.redirectUri
    });
    // this.s3Service = new S3Service(this.logger, this.fileStorage, {
    //   region: appConfig.s3.region,
    //   accessKeyId: appConfig.s3.accessKeyId,
    //   secretAccessKey: appConfig.s3.secretAccessKey,
    //   bucketName: appConfig.s3.bucketName
    // });
    this.s3Service = new CloudinaryService(this.logger, {
      cloudName: appConfig.cloudinary.cloudName,
      apiKey: appConfig.cloudinary.apiKey,
      apiSecret: appConfig.cloudinary.apiSecret
    });
    // this.emailSender = new SesEmailSender(this.logger, {
    //   region: appConfig.s3.region,
    //   accessKeyId: appConfig.s3.accessKeyId,
    //   secretAccessKey: appConfig.s3.secretAccessKey,
    //   fromAddress: appConfig.email.fromAddress
    // });
    this.emailSender = new ResendEmailSender(this.logger, {
      apiKey: appConfig.email.apiKey,
      fromAddress: appConfig.email.fromAddress
    });

    this.authService = new AuthService(this.refreshTokenRepository, this.tokenService);
    this.userService = new UserService(this.userRepository, this.userQueryRepository, this.cacheManager);
    this.friendService = new FriendService(this.friendshipRepository, this.cacheManager);
    this.blockService = new BlockService(this.blockRepository, this.cacheManager);
    this.postService = new PostService(this.postQueryRepository, this.postViewsQueue, this.cacheManager, this.logger);
    this.conversationService = new ConversationService(this.conversationRepository, this.conversationMemberRepository);
    this.otpService = new OtpService(this.otpRepository, this.twoFactorService);
    this.roleService = new RoleService(this.roleRepository);
    this.deleteExpiredOtpsUC = new DeleteExpiredOtpsUseCase(this.otpRepository);
    this.deleteExpiredRefreshTokensUC = new DeleteExpiredRefreshTokensUseCase(this.refreshTokenRepository);

    this.notificationsService = new NotificationService(
      this.notificationRepository,
      this.notificationTrimQueue,
      this.userService,
      this.realtimeEmitter
    );

    this.warmRedisCacheUC = new WarmRedisCacheUseCase(
      this.cacheManager,
      this.roleRepository,
      this.roleQueryRepository,
      this.userRepository,
      this.userQueryRepository,
      this.friendshipRepository
    );
    this.checkSystemHealthUC = new CheckSystemHealthUseCase(
      new NodeSystemHealthProbe({ diskPath: appConfig.systemHealth.diskPath }),
      this.cacheManager,
      this.emailSender,
      this.logger,
      {
        adminEmails: appConfig.systemHealth.adminEmails,
        alertCooldownSeconds: appConfig.systemHealth.alertCooldownSeconds,
        thresholds: appConfig.systemHealth.thresholds
      }
    );

    this.routers = buildHttpRouters({
      ...repos,
      logger: this.logger,
      redis: this.redis,
      cacheManager: this.cacheManager,
      realtimeEmitter: this.realtimeEmitter,
      fileStorage: this.fileStorage,
      imageProcessor: this.imageProcessor,
      otpEmailQueue: this.otpEmailQueue,
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
      notificationsService: this.notificationsService,
      twoFactorService: this.twoFactorService
    });

    const socketFeatures = buildSocketFeatures({
      friendshipRepository: this.friendshipRepository,
      conversationMemberRepository: this.conversationMemberRepository
    });
    this.presenceFeature = socketFeatures.presenceFeature;
    this.chatFeature = socketFeatures.chatFeature;
  }

  public static getOrSet(database: DatabasePort, redis: RedisClientPort, socket: SocketServer): Container {
    if (!Container.instance) {
      Container.instance = new Container(database, redis, socket);
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

  public getContext() {
    return {
      database: this.database,
      redis: this.redis,
      socket: this.socket
    };
  }

  public getLogger(): LoggerPort {
    return this.logger;
  }

  public getSocketDeps() {
    return {
      tokenService: this.tokenService,
      userService: this.userService,
      features: [this.presenceFeature, this.chatFeature]
    };
  }

  public getWorkerDeps() {
    return {
      emailSender: this.emailSender,
      otpRepository: this.otpRepository,
      postCommandRepository: this.postCommandRepository,
      notificationService: this.notificationsService,
      mediaRepository: this.videoStatusRepository,
      s3Service: this.s3Service,
      fileStorage: this.fileStorage,
      deleteExpiredOtpsUC: this.deleteExpiredOtpsUC,
      deleteExpiredRefreshTokensUC: this.deleteExpiredRefreshTokensUC,
      warmRedisCacheUC: this.warmRedisCacheUC,
      checkSystemHealthUC: this.checkSystemHealthUC
    };
  }
}

export default Container;
