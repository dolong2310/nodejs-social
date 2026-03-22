/*
 * This file implements the Dependency Injection Container for the application.
 * It manages the instantiation and retrieval of repositories, services, controllers, and validations.
 */

import DatabaseService from '@/database/mongodb/database.service';
import RedisService from '@/database/redis/redis.service';
// Queues
import { QueueService } from '@/queue';
import { IEmailJobQueue } from '@/queue/queues/email.queue';
import { IVideoHLSJobQueue } from '@/queue/queues/video-hls.queue';
// Repositories
import { BlockRepository } from '@/repositories/block.repository';
import { BookmarkRepository, IBookmarkRepository } from '@/repositories/bookmark.repository';
import { ILikeRepository, LikeRepository } from '@/repositories/like.repository';
import { FriendRequestRepository } from '@/repositories/friendRequest.repository';
import { FriendshipRepository, IFriendshipRepository } from '@/repositories/friendship.repository';
import { IMediaRepository, MediaRepository } from '@/repositories/media.repository';
import { IPostRepository, PostRepository } from '@/repositories/post.repository';
import { ISearchRepository, SearchRepository } from '@/repositories/search.repository';
import { IUserRepository, UserRepository } from '@/repositories/user.repository';
import { ChatMemberRepository, IChatMemberRepository } from '@/repositories/chatMember.repository';
import { ChatMessageRepository } from '@/repositories/chatMessage.repository';
import { ChatRepository } from '@/repositories/chat.repository';
import { NotificationRepository } from '@/repositories/notification.repository';
// Services
import AuthService, { IAuthService } from '@/services/auth.service';
import BookmarksService, { IBookmarksService } from '@/services/bookmarks.service';
import LikesService, { ILikesService } from '@/services/likes.service';
import FriendsService, { IFriendsService } from '@/services/friends.service';
import BlocksService, { IBlocksService } from '@/services/blocks.service';
import { IRealtimeChatEmitter } from '@/ports/realtimeChatEmitter.port';
import ChatMessagesService, { IChatMessagesService } from '@/services/chatMessages.service';
import ChatsService, { IChatsService } from '@/services/chats.service';
import NotificationsService, { INotificationsService, ISocketUserEmitter } from '@/services/notifications.service';
import MediaService, { IMediaService } from '@/services/media.service';
import OAuthService, { IOAuthService } from '@/services/oauth.service';
import PostsService, { IPostsService } from '@/services/posts.service';
import S3Service, { IS3Service } from '@/services/s3.service';
import SearchService, { ISearchService } from '@/services/search.service';
import TokenService, { ITokenService } from '@/services/token.service';
import UsersService, { IUsersService } from '@/services/users.service';
// Controllers
import AuthController, { IAuthController } from '@/controllers/auth.controller';
import BookmarksController, { IBookmarksController } from '@/controllers/bookmarks.controller';
import LikesController, { ILikesController } from '@/controllers/likes.controller';
import MediaController, { IMediaController } from '@/controllers/media.controller';
import OAuthController, { IOAuthController } from '@/controllers/oauth.controller';
import PostsController, { IPostsController } from '@/controllers/posts.controller';
import SearchController, { ISearchController } from '@/controllers/search.controller';
import UsersController, { IUsersController } from '@/controllers/users.controller';
import FriendsController, { IFriendsController } from '@/controllers/friends.controller';
import BlocksController, { IBlocksController } from '@/controllers/blocks.controller';
import ChatMessagesController, { IChatMessagesController } from '@/controllers/chatMessages.controller';
import ChatsController, { IChatsController } from '@/controllers/chats.controller';
import NotificationsController, { INotificationsController } from '@/controllers/notifications.controller';
// Validations
import AuthValidation, { IAuthValidation } from '@/validations/auth.validation';
import PostsValidation, { IPostsValidation } from '@/validations/posts.validation';
import SearchValidation, { ISearchValidation } from '@/validations/search.validation';
import UsersValidation, { IUsersValidation } from '@/validations/users.validation';
import FriendsValidation, { IFriendsValidation } from '@/validations/friends.validation';
import BlocksValidation, { IBlocksValidation } from '@/validations/blocks.validation';
import ChatsValidation, { IChatsValidation } from '@/validations/chats.validation';
import NotificationsValidation, { INotificationsValidation } from '@/validations/notifications.validation';

export interface IContainer {
  // Repositories
  getUserRepository(): IUserRepository;
  getBookmarkRepository(): IBookmarkRepository;
  getLikeRepository(): ILikeRepository;
  getMediaRepository(): IMediaRepository;
  getPostRepository(): IPostRepository;
  getSearchRepository(): ISearchRepository;

  // Services
  getTokenService(): ITokenService;
  getAuthService(): IAuthService;
  getUsersService(): IUsersService;
  getBookmarksService(): IBookmarksService;
  getLikesService(): ILikesService;
  getFriendsService(): IFriendsService;
  getBlocksService(): IBlocksService;
  getMediaService(): IMediaService;
  getOAuthService(): IOAuthService;
  getPostsService(): IPostsService;
  getSearchService(): ISearchService;
  getChatsService(): IChatsService;
  getChatMessagesService(): IChatMessagesService;
  getNotificationsService(): INotificationsService;

  // Controllers
  getAuthController(): IAuthController;
  getUsersController(): IUsersController;
  getBookmarksController(): IBookmarksController;
  getLikesController(): ILikesController;
  getMediaController(): IMediaController;
  getOAuthController(): IOAuthController;
  getPostsController(): IPostsController;
  getSearchController(): ISearchController;
  getFriendsController(): IFriendsController;
  getBlocksController(): IBlocksController;
  getChatsController(): IChatsController;
  getChatMessagesController(): IChatMessagesController;
  getNotificationsController(): INotificationsController;

  // Validations
  getAuthValidation(): IAuthValidation;
  getUsersValidation(): IUsersValidation;
  getPostsValidation(): IPostsValidation;
  getSearchValidation(): ISearchValidation;
  getFriendsValidation(): IFriendsValidation;
  getBlocksValidation(): IBlocksValidation;
  getChatsValidation(): IChatsValidation;
  getNotificationsValidation(): INotificationsValidation;

  getChatMemberRepository(): IChatMemberRepository;
  getFriendshipRepository(): IFriendshipRepository;

  bindNotificationsSocket(emitter: ISocketUserEmitter | null): void;
  bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void;
}

export class Container implements IContainer {
  private static instance: Container | null = null;
  private db: DatabaseService;
  private redis: RedisService;

  // Repositories
  private userRepository!: IUserRepository;
  private bookmarkRepository!: IBookmarkRepository;
  private likeRepository!: ILikeRepository;
  private friendshipRepository!: FriendshipRepository;
  private friendRequestRepository!: FriendRequestRepository;
  private blockRepository!: BlockRepository;
  private mediaRepository!: IMediaRepository;
  private postRepository!: IPostRepository;
  private searchRepository!: ISearchRepository;
  private chatRepository!: ChatRepository;
  private chatMemberRepository!: ChatMemberRepository;
  private chatMessageRepository!: ChatMessageRepository;
  private notificationRepository!: NotificationRepository;

  // Common Services
  private tokenService!: ITokenService;
  private s3Service!: IS3Service;
  // private emailService!: IEmailService;
  // private queueService!: IQueueService;

  // Services
  private authService!: IAuthService;
  private usersService!: IUsersService;
  private bookmarksService!: IBookmarksService;
  private likesService!: ILikesService;
  private friendsService!: IFriendsService;
  private blocksService!: IBlocksService;
  private mediaService!: IMediaService;
  private oauthService!: IOAuthService;
  private postsService!: IPostsService;
  private searchService!: ISearchService;
  private chatsService!: IChatsService;
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
  private chatsController!: IChatsController;
  private chatMessagesController!: IChatMessagesController;
  private notificationsController!: INotificationsController;

  // Validations
  private authValidation!: IAuthValidation;
  private usersValidation!: IUsersValidation;
  private postsValidation!: IPostsValidation;
  private searchValidation!: ISearchValidation;
  private friendsValidation!: IFriendsValidation;
  private blocksValidation!: IBlocksValidation;
  private chatsValidation!: IChatsValidation;
  private notificationsValidation!: INotificationsValidation;

  // Queues
  private emailJobQueue!: IEmailJobQueue;
  private videoHLSJobQueue!: IVideoHLSJobQueue;

  private constructor(db: DatabaseService, redis: RedisService) {
    this.db = db;
    this.redis = redis;
    this.initializeQueues();
    this.initializeRepositories();
    this.initializeServices();
    this.initializeControllers();
    this.initializeValidations();
  }

  public static getOrSet(db: DatabaseService, redis: RedisService): Container {
    if (!Container.instance) {
      Container.instance = new Container(db, redis);
    }
    return Container.instance;
  }

  public static get(): Container {
    if (!Container.instance) {
      throw new Error('Container has not been initialized. Call Container.getOrSet() during bootstrap.');
    }
    return Container.instance;
  }

  // Method to reset the singleton instance
  // This can be useful for testing purposes or when you need to reinitialize the container
  public static resetInstance(): void {
    Container.instance = null;
  }

  private initializeRepositories(): void {
    this.userRepository = new UserRepository(this.db);
    this.bookmarkRepository = new BookmarkRepository(this.db);
    this.likeRepository = new LikeRepository(this.db);
    this.friendshipRepository = new FriendshipRepository(this.db);
    this.friendRequestRepository = new FriendRequestRepository(this.db);
    this.blockRepository = new BlockRepository(this.db);
    this.mediaRepository = new MediaRepository(this.db);
    this.postRepository = new PostRepository(this.db);
    this.searchRepository = new SearchRepository(this.db);
    this.chatRepository = new ChatRepository(this.db);
    this.chatMemberRepository = new ChatMemberRepository(this.db);
    this.chatMessageRepository = new ChatMessageRepository(this.db);
    this.notificationRepository = new NotificationRepository(this.db);
  }

  private initializeServices(): void {
    // Common Services
    this.tokenService = new TokenService();
    this.s3Service = new S3Service();
    // this.emailService = new EmailService();
    // this.queueService = new QueueService({ onStartWhenEnqueue: true });

    // Services
    this.authService = new AuthService(this.userRepository, this.tokenService, this.emailJobQueue, this.redis);
    this.usersService = new UsersService(this.userRepository, this.redis);
    this.bookmarksService = new BookmarksService(this.bookmarkRepository);
    this.likesService = new LikesService(this.likeRepository);
    this.notificationsService = new NotificationsService(
      this.notificationRepository,
      this.userRepository,
      this.blockRepository
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
      this.friendshipRepository,
      this.friendRequestRepository,
      this.friendsService,
      this.userRepository
    );
    this.mediaService = new MediaService(this.mediaRepository, this.s3Service, this.videoHLSJobQueue);
    this.oauthService = new OAuthService(this.authService, this.usersService);
    this.postsService = new PostsService(this.postRepository, this.blockRepository, this.friendsService);
    this.searchService = new SearchService(
      this.searchRepository,
      this.friendsService,
      this.postsService,
      this.blockRepository,
      this.redis
    );
    this.chatsService = new ChatsService(
      this.chatRepository,
      this.chatMemberRepository,
      this.friendsService,
      this.blockRepository,
      this.notificationsService
    );
    this.chatMessagesService = new ChatMessagesService(
      this.chatRepository,
      this.chatMemberRepository,
      this.chatMessageRepository,
      this.blockRepository,
      this.notificationsService
    );
  }

  private initializeControllers(): void {
    this.authController = new AuthController(this.authService, this.usersService);
    this.usersController = new UsersController(this.usersService, this.blockRepository);
    this.bookmarksController = new BookmarksController(this.bookmarksService);
    this.likesController = new LikesController(this.likesService);
    this.mediaController = new MediaController(this.mediaService, this.s3Service);
    this.oauthController = new OAuthController(this.oauthService);
    this.postsController = new PostsController(this.postsService, this.friendsService);
    this.searchController = new SearchController(this.searchService);
    this.friendsController = new FriendsController(this.friendsService);
    this.blocksController = new BlocksController(this.blocksService);
    this.chatsController = new ChatsController(this.chatsService);
    this.chatMessagesController = new ChatMessagesController(this.chatMessagesService);
    this.notificationsController = new NotificationsController(this.notificationsService);
  }

  private initializeValidations(): void {
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
    this.chatsValidation = new ChatsValidation(this.usersValidation);
    this.notificationsValidation = new NotificationsValidation(this.usersValidation);
  }

  private initializeQueues(): void {
    const mq = QueueService.get();
    this.emailJobQueue = mq.getEmailJobQueue();
    this.videoHLSJobQueue = mq.getVideoHLSJobQueue();
  }

  // Repositories
  public getUserRepository(): IUserRepository {
    return this.userRepository;
  }

  public getBookmarkRepository(): IBookmarkRepository {
    return this.bookmarkRepository;
  }

  public getLikeRepository(): ILikeRepository {
    return this.likeRepository;
  }

  public getMediaRepository(): IMediaRepository {
    return this.mediaRepository;
  }

  public getPostRepository(): IPostRepository {
    return this.postRepository;
  }

  public getSearchRepository(): ISearchRepository {
    return this.searchRepository;
  }

  // Services
  public getTokenService(): ITokenService {
    return this.tokenService;
  }

  public getAuthService(): IAuthService {
    return this.authService;
  }

  public getUsersService(): IUsersService {
    return this.usersService;
  }

  public getBookmarksService(): IBookmarksService {
    return this.bookmarksService;
  }

  public getLikesService(): ILikesService {
    return this.likesService;
  }

  public getFriendsService(): IFriendsService {
    return this.friendsService;
  }

  public getBlocksService(): IBlocksService {
    return this.blocksService;
  }

  public getMediaService(): IMediaService {
    return this.mediaService;
  }

  public getOAuthService(): IOAuthService {
    return this.oauthService;
  }

  public getPostsService(): IPostsService {
    return this.postsService;
  }

  public getSearchService(): ISearchService {
    return this.searchService;
  }

  public getChatsService(): IChatsService {
    return this.chatsService;
  }

  public getChatMessagesService(): IChatMessagesService {
    return this.chatMessagesService;
  }

  public getNotificationsService(): INotificationsService {
    return this.notificationsService;
  }

  public bindNotificationsSocket(emitter: ISocketUserEmitter | null): void {
    this.notificationsService.bindSocketEmitter(emitter);
  }

  public getChatMemberRepository(): IChatMemberRepository {
    return this.chatMemberRepository;
  }

  public getFriendshipRepository(): IFriendshipRepository {
    return this.friendshipRepository;
  }

  public bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void {
    this.chatMessagesService.bindRealtimeChatEmitter(emitter);
  }

  // Controllers
  public getAuthController(): IAuthController {
    return this.authController;
  }

  public getUsersController(): IUsersController {
    return this.usersController;
  }

  public getBookmarksController(): IBookmarksController {
    return this.bookmarksController;
  }

  public getLikesController(): ILikesController {
    return this.likesController;
  }

  public getMediaController(): IMediaController {
    return this.mediaController;
  }

  public getOAuthController(): IOAuthController {
    return this.oauthController;
  }

  public getPostsController(): IPostsController {
    return this.postsController;
  }

  public getSearchController(): ISearchController {
    return this.searchController;
  }

  public getFriendsController(): IFriendsController {
    return this.friendsController;
  }

  public getBlocksController(): IBlocksController {
    return this.blocksController;
  }

  public getChatsController(): IChatsController {
    return this.chatsController;
  }

  public getChatMessagesController(): IChatMessagesController {
    return this.chatMessagesController;
  }

  public getNotificationsController(): INotificationsController {
    return this.notificationsController;
  }

  // Validations
  public getAuthValidation(): IAuthValidation {
    return this.authValidation;
  }

  public getUsersValidation(): IUsersValidation {
    return this.usersValidation;
  }

  public getPostsValidation(): IPostsValidation {
    return this.postsValidation;
  }

  public getSearchValidation(): ISearchValidation {
    return this.searchValidation;
  }

  public getFriendsValidation(): IFriendsValidation {
    return this.friendsValidation;
  }

  public getBlocksValidation(): IBlocksValidation {
    return this.blocksValidation;
  }

  public getChatsValidation(): IChatsValidation {
    return this.chatsValidation;
  }

  public getNotificationsValidation(): INotificationsValidation {
    return this.notificationsValidation;
  }
}

export default Container;
