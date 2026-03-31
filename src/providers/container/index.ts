/*
 * This file implements the Dependency Injection Container for the application.
 * It manages the instantiation and retrieval of repositories, services, controllers, and validations.
 */

import { Constructor } from '@/interfaces';
import {
  AuthController,
  AuthService,
  AuthValidation,
  BlockRepository,
  BlocksController,
  BlocksService,
  BlocksValidation,
  BookmarkRepository,
  BookmarksController,
  BookmarksService,
  ChatMessageRepository,
  ChatMessagesController,
  ChatMessagesService,
  ChatMessagesValidation,
  ConversationMemberRepository,
  ConversationRepository,
  ConversationsController,
  ConversationsService,
  ConversationsValidation,
  FriendRequestRepository,
  FriendsController,
  FriendshipRepository,
  FriendsService,
  FriendsValidation,
  IRealtimeChatEmitter,
  ISocketUserEmitter,
  LikeRepository,
  LikesController,
  LikesService,
  MediaController,
  MediaRepository,
  MediaService,
  NotificationRepository,
  NotificationsController,
  NotificationsService,
  NotificationsValidation,
  OAuthController,
  OAuthService,
  PostRepository,
  PostsController,
  PostsService,
  PostsValidation,
  SearchController,
  SearchRepository,
  SearchService,
  SearchValidation,
  UserRepository,
  UsersController,
  UsersService,
  UsersValidation
} from '@/modules';
import { S3Service, TokenService } from '@/shared';
import { BaseContainer } from './base.container';

export interface IContainer {
  get<T>(target: Constructor<T>): T;

  // Bindings
  bindNotificationsSocket(emitter: ISocketUserEmitter | null): void;
  bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void;
}

export class Container extends BaseContainer implements IContainer {
  private static instance: Container | null = null;

  private constructor() {
    super();
    this.initializeRepositories();
    this.initializeServices();
    this.initializeControllers();
    this.initializeValidations();
  }

  /**
   * Get or init the container instance.
   */
  public static getOrSet(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Get the container instance.
   */
  public static get(): Container {
    if (!Container.instance) {
      throw new Error('Container has not been initialized. Call Container.getOrSet() during bootstrap.');
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
  public bindNotificationsSocket(emitter: ISocketUserEmitter | null): void {
    this.get(NotificationsService).bindSocketEmitter(emitter);
  }

  public bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void {
    this.get(ChatMessagesService).bindRealtimeChatEmitter(emitter);
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
