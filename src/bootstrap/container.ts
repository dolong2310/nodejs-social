import { appConfig } from '@/bootstrap/config/app.config';
import { buildHttpRouters } from '@/bootstrap/di/http-routes';
import { createContainerQueues } from '@/bootstrap/di/queues';
import { createContainerRepositories } from '@/bootstrap/di/repositories';
import { buildSocketFeatures } from '@/bootstrap/di/socket-features';
import type { IContainer } from '@/bootstrap/di/types';
import logger from '@/infrastructure/logger/create-logger';
import { DatabasePort } from '@/infrastructure/persistence/mongodb/database';
import { TwoFactorAuthService } from '@/infrastructure/services/2fa.service';
import { EmailService, EmailServicePort } from '@/infrastructure/services/email.service';
import { GoogleOAuthService } from '@/infrastructure/services/google-oauth.service';
import { HashingService } from '@/infrastructure/services/hashing.service';
import { JwtService } from '@/infrastructure/services/jwt.service';
import { S3Service } from '@/infrastructure/services/s3.service';
import { LocalFileStorage } from '@/infrastructure/services/storages/file-storage.service';
import { SharpImageProcessor } from '@/infrastructure/services/storages/image-processor.service';
import { TwoFactorAuthPort } from '@/modules/auth/application/ports/2fa.port';
import { EmailQueuePort } from '@/modules/auth/application/ports/email-job.port';
import { GoogleOAuthServicePort } from '@/modules/auth/application/ports/google-oauth.out-port';
import { JwtPort } from '@/modules/auth/application/ports/jwt.port';
import { AuthService, AuthServicePort } from '@/modules/auth/application/services/auth.service';
import { OtpService, OtpServicePort } from '@/modules/auth/application/services/otp.service';
import { TokenService } from '@/modules/auth/application/services/token.service';
import { TokenServicePort } from '@/modules/auth/application/services/token.service.type';
import { OtpRepositoryPort } from '@/modules/auth/domain/repositories/otp.repository';
import { RefreshTokenRepositoryPort } from '@/modules/auth/domain/repositories/refresh-token.repository';
import { BlockService, BlockServicePort } from '@/modules/block/application/services/block.service';
import { BlockRepositoryPort } from '@/modules/block/domain/repositories/block.repository';
import { BookmarkRepositoryPort } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { ConversationMemberQueryRepositoryPort } from '@/modules/conversation/application/ports/queries/conversation-member-query.repository';
import {
  ConversationService,
  ConversationServicePort
} from '@/modules/conversation/application/services/conversation.service';
import { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { RealtimeEmitterPort } from '@/modules/core/application/ports/realtime-emitter.port';
import { StoragePort } from '@/modules/core/application/ports/storage.port';
import { FriendService, FriendServicePort } from '@/modules/friend/application/services/friend.service';
import { FriendRequestRepositoryPort } from '@/modules/friend/domain/repositories/friend-request.repository';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';
import { HashtagRepositoryPort } from '@/modules/hashtag/domain/repositories/hashtag.repository';
import { LikeRepositoryPort } from '@/modules/like/domain/repositories/like.repository';
import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { ImageProcessorPort } from '@/modules/media/application/ports/image-processor.port';
import { VideoStreamQueuePort } from '@/modules/media/application/ports/video-stream-job.port';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import { NotificationTrimQueuePort } from '@/modules/notification/application/ports/notification-trim-job.port';
import {
  NotificationService,
  NotificationServicePort
} from '@/modules/notification/application/services/notification.service';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import { PostCommandRepositoryPort } from '@/modules/post/application/ports/command/post-command.repository';
import { PostViewsQueuePort } from '@/modules/post/application/ports/post-views-job.port';
import { PostQueryRepositoryPort } from '@/modules/post/application/ports/queries/post-query.repository';
import { PostService, PostServicePort } from '@/modules/post/application/services/post.service';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import { RoleQueryRepositoryPort } from '@/modules/role/application/ports/queries/role-query.repository';
import { RoleService, RoleServicePort } from '@/modules/role/application/services/role.service';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';
import { UserQueryRepositoryPort } from '@/modules/user/application/ports/queries/user-query.repository';
import { UserService, UserServicePort } from '@/modules/user/application/services/user.service';
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

  private readonly database: DatabasePort;
  private readonly redis: CacheManagerPort;
  private readonly logger: LoggerPort = logger;

  private readonly realtimeEmitter: RealtimeEmitterPort;

  private readonly fileStorage: FileStoragePort;
  private readonly imageProcessor: ImageProcessorPort;

  private readonly emailQueue: EmailQueuePort;
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

  private readonly s3Service: StoragePort;
  private readonly emailService: EmailServicePort;

  private readonly authService: AuthServicePort;
  private readonly userService: UserServicePort;
  private readonly friendService: FriendServicePort;
  private readonly blockService: BlockServicePort;
  private readonly postService: PostServicePort;
  private readonly conversationService: ConversationServicePort;
  private readonly otpService: OtpServicePort;
  private readonly roleService: RoleServicePort;
  private readonly notificationsService: NotificationServicePort;

  private readonly presenceFeature: PresenceFeature;
  private readonly chatFeature: ChatFeature;

  private constructor(database: DatabasePort, redis: CacheManagerPort, socket: SocketIOServer) {
    this.database = database;
    this.redis = redis;

    this.jwtService = new JwtService();
    this.hashingService = new HashingService();
    this.twoFactorService = new TwoFactorAuthService();
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
    this.roleQueryRepository = repos.roleQueryRepository;

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
    this.notificationsService = new NotificationService(
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

  public static getOrSet(database: DatabasePort, redis: CacheManagerPort, socket: SocketIOServer): Container {
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
