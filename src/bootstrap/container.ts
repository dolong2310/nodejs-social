import { appConfig } from '@/bootstrap/config/app.config';
import { buildHttpRouters } from '@/bootstrap/di/http-routes';
import { createContainerQueues } from '@/bootstrap/di/queues';
import { createContainerRepositories } from '@/bootstrap/di/repositories';
import { buildSocketFeatures } from '@/bootstrap/di/socket-features';
import type { IContainer } from '@/bootstrap/di/types';
import logger from '@/infrastructure/logger/create-logger';
import { Database } from '@/infrastructure/persistence/mongodb/database';
import { Redis } from '@/infrastructure/persistence/redis/redis';
import { TwoFactorAuthService } from '@/infrastructure/services/2fa.service';
import { EmailService, IEmailService } from '@/infrastructure/services/email.service';
import { GoogleOAuthService } from '@/infrastructure/services/google-oauth.service';
import { HashingService } from '@/infrastructure/services/hashing.service';
import { JwtService } from '@/infrastructure/services/jwt.service';
import { S3Service } from '@/infrastructure/services/s3.service';
import { LocalFileStorage } from '@/infrastructure/services/storages/file-storage.service';
import { SharpImageProcessor } from '@/infrastructure/services/storages/image-processor.service';
import { AuthService, IAuthService } from '@/modules/auth/application/services/auth.service';
import { IOtpService, OtpService } from '@/modules/auth/application/services/otp.service';
import { TokenService } from '@/modules/auth/application/services/token.service';
import { ITokenService } from '@/modules/auth/application/services/token.service.type';
import { OtpRepositoryPort } from '@/modules/auth/domain/repositories/otp.repository';
import { RefreshTokenRepositoryPort } from '@/modules/auth/domain/repositories/refresh-token.repository';
import { BlockService, IBlockService } from '@/modules/block/application/services/block.service';
import { BlockRepositoryPort } from '@/modules/block/domain/repositories/block.repository';
import { BookmarkRepositoryPort } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { ConversationMemberQueryRepositoryPort } from '@/modules/conversation/application/ports/queries/conversation-member-query.repository';
import {
  ConversationService,
  IConversationService
} from '@/modules/conversation/application/services/conversation.service';
import { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { IEmailQueue } from '@/modules/core/application/ports/email-job.port';
import { FileStoragePort } from '@/modules/core/application/ports/file-storage.port';
import { IGoogleOAuthService } from '@/modules/core/application/ports/google-oauth.out-port';
import { ImageProcessorPort } from '@/modules/core/application/ports/image-processor.port';
import { INotificationTrimQueue } from '@/modules/core/application/ports/notification-trim-job.port';
import { IPostViewsQueue } from '@/modules/core/application/ports/post-views-job.port';
import { RealtimeEmitterPort } from '@/modules/core/application/ports/realtime-emitter.port';
import { StoragePort } from '@/modules/core/application/ports/storage.port';
import { IVideoStreamQueue } from '@/modules/core/application/ports/video-stream-job.port';
import { LoggerPort } from '@/modules/core/infrastructure/logger/logger.port';
import { FriendService, IFriendService } from '@/modules/friend/application/services/friend.service';
import { FriendRequestRepositoryPort } from '@/modules/friend/domain/repositories/friend-request.repository';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';
import { HashtagRepositoryPort } from '@/modules/hashtag/domain/repositories/hashtag.repository';
import { LikeRepositoryPort } from '@/modules/like/domain/repositories/like.repository';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import {
  INotificationsService,
  NotificationsService
} from '@/modules/notification/application/services/notification.service';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import { PostCommandRepositoryPort } from '@/modules/post/application/ports/command/post-command.repository';
import { PostQueryRepositoryPort } from '@/modules/post/application/ports/queries/post-query.repository';
import { IPostService, PostService } from '@/modules/post/application/services/post.service';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import { IRoleService, RoleService } from '@/modules/role/application/services/role.service';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';
import { UserQueryRepositoryPort } from '@/modules/user/application/ports/queries/user-query.repository';
import { IUserService, UserService } from '@/modules/user/application/services/user.service';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { APP_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { ChatFeature } from '@/presentation/socket/features/chat.feature';
import { PresenceFeature } from '@/presentation/socket/features/presence.feature';
import { RealtimeEmitter } from '@/presentation/socket/realtime-emitter';
import { type Server as SocketIOServer } from 'socket.io';
export type { IContainer } from '@/bootstrap/di/types';

export class Container implements IContainer {
  private static instance: Container | null = null;

  private readonly routers: BaseRoute[];

  private readonly database: Database;
  private readonly redis: CacheManagerPort;
  private readonly logger: LoggerPort = logger;

  private readonly realtimeEmitter: RealtimeEmitterPort;

  private readonly fileStorage: FileStoragePort;
  private readonly imageProcessor: ImageProcessorPort;

  private readonly emailQueue: IEmailQueue;
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
  private readonly postCommandRepository: PostCommandRepositoryPort;
  private readonly userQueryRepository: UserQueryRepositoryPort;
  private readonly conversationMemberQueryRepository: ConversationMemberQueryRepositoryPort;

  private readonly jwtService = new JwtService();
  private readonly tokenService: ITokenService;
  private readonly hashingService = new HashingService();
  private readonly twoFactorService = new TwoFactorAuthService();
  private readonly googleOAuthService: IGoogleOAuthService;

  private readonly s3Service: StoragePort;
  private readonly emailService: IEmailService;

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

  private constructor(database: Database, redis: Redis, socket: SocketIOServer) {
    this.database = database;
    this.redis = redis;

    this.fileStorage = new LocalFileStorage();
    this.imageProcessor = new SharpImageProcessor();

    this.realtimeEmitter = new RealtimeEmitter(socket);

    const queues = createContainerQueues(this.logger);
    this.emailQueue = queues.emailQueue;
    this.videoStreamQueue = queues.videoStreamQueue;
    this.notificationTrimQueue = queues.notificationTrimQueue;
    this.postViewsQueue = queues.postViewsQueue;

    const repos = createContainerRepositories(this.database.db, this.database.dbClient, this.logger);
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

    this.postQueryRepository = repos.postQueryRepository;
    this.postCommandRepository = repos.postCommandRepository;
    this.userQueryRepository = repos.userQueryRepository;
    this.conversationMemberQueryRepository = repos.conversationMemberQueryRepository;

    this.tokenService = new TokenService(this.jwtService, appConfig);
    this.googleOAuthService = new GoogleOAuthService();
    this.s3Service = new S3Service(this.logger, this.fileStorage);
    this.emailService = new EmailService(this.logger, this.fileStorage);

    this.authService = new AuthService(this.refreshTokenRepository, this.tokenService);
    this.userService = new UserService(this.userRepository, this.userQueryRepository, this.redis);
    this.friendService = new FriendService(this.friendshipRepository, this.redis);
    this.blockService = new BlockService(this.blockRepository, this.redis);
    this.postService = new PostService(this.postQueryRepository, this.postViewsQueue, this.redis, this.logger);
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
      logger: this.logger,
      redis: this.redis,
      realtimeEmitter: this.realtimeEmitter,
      fileStorage: this.fileStorage,
      imageProcessor: this.imageProcessor,
      emailQueue: this.emailQueue,
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

  public static getOrSet(mongo: Database, redis: Redis, socket: SocketIOServer): Container {
    if (!Container.instance) {
      Container.instance = new Container(mongo, redis, socket);
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
      emailService: this.emailService,
      otpRepository: this.otpRepository,
      postCommandRepository: this.postCommandRepository,
      notificationRepository: this.notificationRepository,
      mediaRepository: this.videoStatusRepository,
      s3Service: this.s3Service,
      fileStorage: this.fileStorage
    };
  }
}

export default Container;
