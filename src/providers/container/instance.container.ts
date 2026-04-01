/*
 * This file implements the Dependency Injection Container for the application.
 * It manages the instantiation and retrieval of repositories, services, controllers, and validations.
 */

import { SEED_ERROR_MESSAGE } from '@/constants/message.constant';
import { Constructor } from '@/interfaces/types/constructor.type';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthValidation } from '@/modules/auth/auth.validation';
import { BlocksController } from '@/modules/blocks/blocks.controller';
import { BlockRepository } from '@/modules/blocks/blocks.repository';
import { BlocksService } from '@/modules/blocks/blocks.service';
import { BlocksValidation } from '@/modules/blocks/blocks.validation';
import { BookmarksController } from '@/modules/bookmarks/bookmarks.controller';
import { BookmarkRepository } from '@/modules/bookmarks/bookmarks.repository';
import { BookmarksService } from '@/modules/bookmarks/bookmarks.service';
import { ChatMessagesController } from '@/modules/chatMessages/chatMessages.controller';
import { ChatMessageRepository } from '@/modules/chatMessages/chatMessages.repository';
import { ChatMessagesService, IRealtimeChatEmitter } from '@/modules/chatMessages/chatMessages.service';
import { ChatMessagesValidation } from '@/modules/chatMessages/chatMessages.validation';
import { ConversationMemberRepository } from '@/modules/conversations/conversationMember.repository';
import { ConversationsController } from '@/modules/conversations/conversations.controller';
import { ConversationRepository } from '@/modules/conversations/conversations.repository';
import { ConversationsService } from '@/modules/conversations/conversations.service';
import { ConversationsValidation } from '@/modules/conversations/conversations.validation';
import { FriendRequestRepository } from '@/modules/friends/friendRequests.repository';
import { FriendsController } from '@/modules/friends/friends.controller';
import { FriendsService } from '@/modules/friends/friends.service';
import { FriendsValidation } from '@/modules/friends/friends.validation';
import { FriendshipRepository } from '@/modules/friends/friendship.repository';
import { LikesController } from '@/modules/likes/likes.controller';
import { LikeRepository } from '@/modules/likes/likes.repository';
import { LikesService } from '@/modules/likes/likes.service';
import { MediaController } from '@/modules/media/media.controller';
import { MediaRepository } from '@/modules/media/media.repository';
import { MediaService } from '@/modules/media/media.service';
import { NotificationsController } from '@/modules/notifications/notifications.controller';
import { NotificationRepository } from '@/modules/notifications/notifications.repository';
import { ISocketUserEmitter, NotificationsService } from '@/modules/notifications/notifications.service';
import { NotificationsValidation } from '@/modules/notifications/notifications.validation';
import { OAuthController } from '@/modules/oauth/oauth.controller';
import { OAuthService } from '@/modules/oauth/oauth.service';
import { PostsController } from '@/modules/posts/posts.controller';
import { PostRepository } from '@/modules/posts/posts.repository';
import { PostsService } from '@/modules/posts/posts.service';
import { PostsValidation } from '@/modules/posts/posts.validation';
import { SearchController } from '@/modules/search/search.controller';
import { SearchRepository } from '@/modules/search/search.repository';
import { SearchService } from '@/modules/search/search.service';
import { SearchValidation } from '@/modules/search/search.validation';
import { UsersController } from '@/modules/users/users.controller';
import { UserRepository } from '@/modules/users/users.repository';
import { UsersService } from '@/modules/users/users.service';
import { UsersValidation } from '@/modules/users/users.validation';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { RedisService } from '@/providers/database/redis/redis.service';
import { QueueInstance } from '@/providers/queue/queue.instance';
import { EmailJobQueue } from '@/providers/queue/queues/email.queue';
import { NotificationTrimJobQueue } from '@/providers/queue/queues/notification-trim.queue';
import { PostViewsJobQueue } from '@/providers/queue/queues/post-views.queue';
import { VideoHLSJobQueue } from '@/providers/queue/queues/video-hls.queue';
import { S3Service } from '@/shared/services/s3.service';
import { TokenService } from '@/shared/services/token.service';
import { BaseContainer } from './base.container';

export interface IContainer {
  get<T>(target: Constructor<T>): T;

  // Bindings
  bindNotificationsSocket(emitter: ISocketUserEmitter | null): void;
  bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void;
}

export class Container extends BaseContainer implements IContainer {
  private static instance: Container | null = null;

  private constructor(db: DatabaseService, redis: RedisService) {
    super();
    this.bind(DatabaseService, db);
    this.bind(RedisService, redis);
    this.initializeQueues();
    this.initializeRepositories();
    this.initializeServices();
    this.initializeControllers();
    this.initializeValidations();
  }

  /**
   * Get or init the container instance.
   */
  public static getOrSet(db: DatabaseService, redis: RedisService): Container {
    if (!Container.instance) {
      Container.instance = new Container(db, redis);
    }
    return Container.instance;
  }

  /**
   * Get the container instance.
   */
  public static get(): Container {
    if (!Container.instance) {
      throw new Error(SEED_ERROR_MESSAGE.CONTAINER_INSTANCE_NOT_INITIALIZED);
    }
    return Container.instance;
  }

  /**
   * Reset the container instance.
   * This can be useful for testing purposes or when you need to reinitialize the container.
   */
  public static resetInstance(): void {
    Container.instance = null;
  }

  /**
   * Get a service from the container.
   */
  public get<T>(target: Constructor<T>): T {
    return this.resolve(target);
  }

  // Bindings
  public bindDatabaseService(instance: DatabaseService): void {
    this.bind(DatabaseService, instance);
  }
  public bindRedisService(instance: RedisService): void {
    this.bind(RedisService, instance);
  }

  public bindNotificationsSocket(emitter: ISocketUserEmitter | null): void {
    this.get(NotificationsService).bindSocketEmitter(emitter);
  }

  public bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void {
    this.get(ChatMessagesService).bindRealtimeChatEmitter(emitter);
  }

  private initializeQueues(): void {
    const mq = QueueInstance.get();
    this.bind(EmailJobQueue, mq.getEmailJobQueue());
    this.bind(VideoHLSJobQueue, mq.getVideoHLSJobQueue());
    this.bind(NotificationTrimJobQueue, mq.getNotificationTrimJobQueue());
    this.bind(PostViewsJobQueue, mq.getPostViewsJobQueue());
  }

  private initializeRepositories(): void {
    this.resolve(UserRepository);
    this.resolve(BookmarkRepository);
    this.resolve(LikeRepository);
    this.resolve(FriendshipRepository);
    this.resolve(FriendRequestRepository);
    this.resolve(BlockRepository);
    this.resolve(MediaRepository);
    this.resolve(PostRepository);
    this.resolve(SearchRepository);
    this.resolve(ConversationRepository);
    this.resolve(ConversationMemberRepository);
    this.resolve(ChatMessageRepository);
    this.resolve(NotificationRepository);
  }

  private initializeServices(): void {
    // Common Services
    this.resolve(TokenService);
    this.resolve(S3Service);

    // Services
    this.resolve(AuthService);
    this.resolve(UsersService);
    this.resolve(BookmarksService);
    this.resolve(LikesService);
    this.resolve(NotificationsService);
    this.resolve(FriendsService);
    this.resolve(BlocksService);
    this.resolve(MediaService);
    this.resolve(OAuthService);
    this.resolve(PostsService);
    this.resolve(SearchService);
    this.resolve(ConversationsService);
    this.resolve(ChatMessagesService);
  }

  private initializeControllers(): void {
    this.resolve(AuthController);
    this.resolve(UsersController);
    this.resolve(BookmarksController);
    this.resolve(LikesController);
    this.resolve(MediaController);
    this.resolve(OAuthController);
    this.resolve(PostsController);
    this.resolve(SearchController);
    this.resolve(FriendsController);
    this.resolve(BlocksController);
    this.resolve(ConversationsController);
    this.resolve(ChatMessagesController);
    this.resolve(NotificationsController);
  }

  private initializeValidations(): void {
    this.resolve(AuthValidation);
    this.resolve(UsersValidation);
    this.resolve(PostsValidation);
    this.resolve(SearchValidation);
    this.resolve(FriendsValidation);
    this.resolve(BlocksValidation);
    this.resolve(ConversationsValidation);
    this.resolve(ChatMessagesValidation);
    this.resolve(NotificationsValidation);
  }
}

export default Container;
