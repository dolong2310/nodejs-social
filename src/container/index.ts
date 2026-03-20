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
import { BookmarkRepository, IBookmarkRepository } from '@/repositories/bookmark.repository';
import { ConversationRepository, IConversationRepository } from '@/repositories/conversation.repository';
import { FollowerRepository, IFollowerRepository } from '@/repositories/follower.repository';
import { IMediaRepository, MediaRepository } from '@/repositories/media.repository';
import { IPostRepository, PostRepository } from '@/repositories/post.repository';
import { ISearchRepository, SearchRepository } from '@/repositories/search.repository';
import { IUserRepository, UserRepository } from '@/repositories/user.repository';
// Services
import AuthService, { IAuthService } from '@/services/auth.service';
import BookmarksService, { IBookmarksService } from '@/services/bookmarks.service';
import ConversationsService, { IConversationsService } from '@/services/conversations.service';
import FollowersService, { IFollowersService } from '@/services/followers.service';
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
import ConversationsController, { IConversationsController } from '@/controllers/conversations.controller';
import FollowersController, { IFollowersController } from '@/controllers/followers.controller';
import MediaController, { IMediaController } from '@/controllers/media.controller';
import OAuthController, { IOAuthController } from '@/controllers/oauth.controller';
import PostsController, { IPostsController } from '@/controllers/posts.controller';
import SearchController, { ISearchController } from '@/controllers/search.controller';
import UsersController, { IUsersController } from '@/controllers/users.controller';
// Validations
import AuthValidation, { IAuthValidation } from '@/validations/auth.validation';
import PostsValidation, { IPostsValidation } from '@/validations/posts.validation';
import SearchValidation, { ISearchValidation } from '@/validations/search.validation';
import UsersValidation, { IUsersValidation } from '@/validations/users.validation';

export interface IContainer {
  // Repositories
  getUserRepository(): IUserRepository;
  getBookmarkRepository(): IBookmarkRepository;
  getConversationRepository(): IConversationRepository;
  getFollowerRepository(): IFollowerRepository;
  getMediaRepository(): IMediaRepository;
  getPostRepository(): IPostRepository;
  getSearchRepository(): ISearchRepository;

  // Services
  getAuthService(): IAuthService;
  getUsersService(): IUsersService;
  getBookmarksService(): IBookmarksService;
  getConversationsService(): IConversationsService;
  getFollowersService(): IFollowersService;
  getMediaService(): IMediaService;
  getOAuthService(): IOAuthService;
  getPostsService(): IPostsService;
  getSearchService(): ISearchService;

  // Controllers
  getAuthController(): IAuthController;
  getUsersController(): IUsersController;
  getBookmarksController(): IBookmarksController;
  getConversationsController(): IConversationsController;
  getFollowersController(): IFollowersController;
  getMediaController(): IMediaController;
  getOAuthController(): IOAuthController;
  getPostsController(): IPostsController;
  getSearchController(): ISearchController;

  // Validations
  getAuthValidation(): IAuthValidation;
  getUsersValidation(): IUsersValidation;
  getPostsValidation(): IPostsValidation;
  getSearchValidation(): ISearchValidation;
}

export class Container implements IContainer {
  private static instance: Container | null = null;
  private db: DatabaseService;
  private redis: RedisService;

  // Repositories
  private userRepository!: IUserRepository;
  private bookmarkRepository!: IBookmarkRepository;
  private conversationRepository!: IConversationRepository;
  private followerRepository!: IFollowerRepository;
  private mediaRepository!: IMediaRepository;
  private postRepository!: IPostRepository;
  private searchRepository!: ISearchRepository;

  // Common Services
  private tokenService!: ITokenService;
  private s3Service!: IS3Service;
  // private emailService!: IEmailService;
  // private queueService!: IQueueService;

  // Services
  private authService!: IAuthService;
  private usersService!: IUsersService;
  private bookmarksService!: IBookmarksService;
  private conversationsService!: IConversationsService;
  private followersService!: IFollowersService;
  private mediaService!: IMediaService;
  private oauthService!: IOAuthService;
  private postsService!: IPostsService;
  private searchService!: ISearchService;

  // Controllers
  private authController!: IAuthController;
  private usersController!: IUsersController;
  private bookmarksController!: IBookmarksController;
  private conversationsController!: IConversationsController;
  private followersController!: IFollowersController;
  private mediaController!: IMediaController;
  private oauthController!: IOAuthController;
  private postsController!: IPostsController;
  private searchController!: ISearchController;

  // Validations
  private authValidation!: IAuthValidation;
  private usersValidation!: IUsersValidation;
  private postsValidation!: IPostsValidation;
  private searchValidation!: ISearchValidation;

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
    this.conversationRepository = new ConversationRepository(this.db);
    this.followerRepository = new FollowerRepository(this.db);
    this.mediaRepository = new MediaRepository(this.db);
    this.postRepository = new PostRepository(this.db);
    this.searchRepository = new SearchRepository(this.db);
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
    this.conversationsService = new ConversationsService(this.conversationRepository);
    this.followersService = new FollowersService(this.followerRepository, this.redis);
    this.mediaService = new MediaService(this.mediaRepository, this.s3Service, this.videoHLSJobQueue);
    this.oauthService = new OAuthService(this.authService, this.usersService);
    this.postsService = new PostsService(this.postRepository);
    this.searchService = new SearchService(this.searchRepository, this.followersService, this.postsService);
  }

  private initializeControllers(): void {
    this.authController = new AuthController(this.authService, this.usersService);
    this.usersController = new UsersController(this.usersService);
    this.bookmarksController = new BookmarksController(this.bookmarksService);
    this.conversationsController = new ConversationsController(this.conversationsService);
    this.followersController = new FollowersController(this.followersService);
    this.mediaController = new MediaController(this.mediaService, this.s3Service);
    this.oauthController = new OAuthController(this.oauthService);
    this.postsController = new PostsController(this.postsService, this.followersService);
    this.searchController = new SearchController(this.searchService);
  }

  private initializeValidations(): void {
    this.authValidation = new AuthValidation(this.tokenService);
    this.usersValidation = new UsersValidation(this.usersService);
    this.postsValidation = new PostsValidation(this.postsService, this.usersService, this.followersService);
    this.searchValidation = new SearchValidation();
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

  public getConversationRepository(): IConversationRepository {
    return this.conversationRepository;
  }

  public getFollowerRepository(): IFollowerRepository {
    return this.followerRepository;
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
  public getAuthService(): IAuthService {
    return this.authService;
  }

  public getUsersService(): IUsersService {
    return this.usersService;
  }

  public getBookmarksService(): IBookmarksService {
    return this.bookmarksService;
  }

  public getConversationsService(): IConversationsService {
    return this.conversationsService;
  }

  public getFollowersService(): IFollowersService {
    return this.followersService;
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

  public getConversationsController(): IConversationsController {
    return this.conversationsController;
  }

  public getFollowersController(): IFollowersController {
    return this.followersController;
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
}

export default Container;
