import { OtpRepositoryPort } from '@/modules/auth/domain/repositories/otp.repository';
import { RefreshTokenRepositoryPort } from '@/modules/auth/domain/repositories/refresh-token.repository';
import { OtpMapper } from '@/modules/auth/infrastructure/mappers/otp.mapper';
import { RefreshTokenMapper } from '@/modules/auth/infrastructure/mappers/refresh-token.mapper';
import { OtpRepository } from '@/modules/auth/infrastructure/mongo/otp.impl.repository';
import { RefreshTokenRepository } from '@/modules/auth/infrastructure/mongo/refresh-token.impl.repository';
import { BlockRepositoryPort } from '@/modules/block/domain/repositories/block.repository';
import { BlockMapper } from '@/modules/block/infrastructure/mappers/block.mapper';
import { BlockRepository } from '@/modules/block/infrastructure/mongo/block.impl.repository';
import { BookmarkRepositoryPort } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { BookmarkMapper } from '@/modules/bookmark/infrastructure/mappers/bookmark.mapper';
import { BookmarkRepository } from '@/modules/bookmark/infrastructure/mongo/bookmark.impl.repository';
import { ConversationMemberQueryRepositoryPort } from '@/modules/conversation/application/ports/queries/conversation-member-query.repository';
import { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import { ChatMessageMapper } from '@/modules/conversation/infrastructure/mappers/chat-message.mapper';
import { ConversationMemberMapper } from '@/modules/conversation/infrastructure/mappers/conversation-member.mapper';
import { ConversationMapper } from '@/modules/conversation/infrastructure/mappers/conversation.mapper';
import { ChatMessageRepository } from '@/modules/conversation/infrastructure/mongo/chat-message.impl.repository';
import { ConversationMemberQueryRepository } from '@/modules/conversation/infrastructure/mongo/conversation-member-query.impl.repository';
import { ConversationMemberRepository } from '@/modules/conversation/infrastructure/mongo/conversation-member.impl.repository';
import { ConversationRepository } from '@/modules/conversation/infrastructure/mongo/conversation.impl.repository';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { FriendRequestRepositoryPort } from '@/modules/friend/domain/repositories/friend-request.repository';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';
import { FriendRequestMapper } from '@/modules/friend/infrastructure/mappers/friend-request.mapper';
import { FriendshipMapper } from '@/modules/friend/infrastructure/mappers/friendship.mapper';
import { FriendRequestRepository } from '@/modules/friend/infrastructure/mongo/friend-request.impl.repository';
import { FriendshipRepository } from '@/modules/friend/infrastructure/mongo/friendship.impl.repository';
import { HashtagRepositoryPort } from '@/modules/hashtag/domain/repositories/hashtag.repository';
import { HashtagMapper } from '@/modules/hashtag/infrastructure/mappers/hashtag.mapper';
import { HashtagRepository } from '@/modules/hashtag/infrastructure/mongo/hashtag.impl.repository';
import { LikeRepositoryPort } from '@/modules/like/domain/repositories/like.repository';
import { LikeMapper } from '@/modules/like/infrastructure/mappers/like.mapper';
import { LikeRepository } from '@/modules/like/infrastructure/mongo/like.impl.repository';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import { NotificationMapper } from '@/modules/notification/infrastructure/mappers/notification.mapper';
import { NotificationRepository } from '@/modules/notification/infrastructure/mongo/notification.impl.repository';
import { PermissionRepositoryPort } from '@/modules/permission/domain/repositories/permission.repository';
import { PermissionMapper } from '@/modules/permission/infrastructure/mappers/permission.mapper';
import { PermissionRepository } from '@/modules/permission/infrastructure/mongo/permission.impl.repository';
import { PostCommandRepositoryPort } from '@/modules/post/application/ports/command/post-command.repository';
import { PostQueryRepositoryPort } from '@/modules/post/application/ports/queries/post-query.repository';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import { PostMapper } from '@/modules/post/infrastructure/mappers/post.mapper';
import { PostCommandRepository } from '@/modules/post/infrastructure/mongo/post-command.impl.repository';
import { PostQueryRepository } from '@/modules/post/infrastructure/mongo/post-query.impl.repository';
import { PostRepository } from '@/modules/post/infrastructure/mongo/post.impl.repository';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';
import { RoleMapper } from '@/modules/role/infrastructure/mappers/role.mapper';
import { RoleRepository } from '@/modules/role/infrastructure/mongo/role.impl.repository';
import { UserQueryRepositoryPort } from '@/modules/user/application/ports/queries/user-query.repository';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { UserMapper } from '@/modules/user/infrastructure/mappers/user.mapper';
import { UserQueryRepository } from '@/modules/user/infrastructure/mongo/user-query.impl.repository';
import { UserRepository } from '@/modules/user/infrastructure/mongo/user.impl.repository';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import { VideoStatusMapper } from '@/modules/media/infrastructure/mappers/video-status.mapper';
import { VideoStatusRepository } from '@/modules/media/infrastructure/mongo/video-status.impl.repository';
import { Db, MongoClient } from 'mongodb';

type Repositories = {
  userRepository: UserRepositoryPort;
  refreshTokenRepository: RefreshTokenRepositoryPort;
  bookmarkRepository: BookmarkRepositoryPort;
  likeRepository: LikeRepositoryPort;
  friendshipRepository: FriendshipRepositoryPort;
  friendRequestRepository: FriendRequestRepositoryPort;
  blockRepository: BlockRepositoryPort;
  videoStatusRepository: VideoStatusRepositoryPort;
  postRepository: PostRepositoryPort;
  hashtagRepository: HashtagRepositoryPort;
  conversationRepository: ConversationRepositoryPort;
  conversationMemberRepository: ConversationMemberRepositoryPort;
  chatMessageRepository: ChatMessageRepositoryPort;
  notificationRepository: NotificationRepositoryPort;
  otpRepository: OtpRepositoryPort;
  roleRepository: RoleRepositoryPort;
  permissionRepository: PermissionRepositoryPort;
};

type QueryRepositories = {
  postQueryRepository: PostQueryRepositoryPort;
  postCommandRepository: PostCommandRepositoryPort;
  userQueryRepository: UserQueryRepositoryPort;
  conversationMemberQueryRepository: ConversationMemberQueryRepositoryPort;
};

export type ContainerRepositories = Repositories & QueryRepositories;

export function createContainerRepositories(db: Db, dbClient: MongoClient, logger: LoggerPort): ContainerRepositories {
  const userMapper = new UserMapper();
  const refreshTokenMapper = new RefreshTokenMapper();
  const bookmarkMapper = new BookmarkMapper();
  const likeMapper = new LikeMapper();
  const friendshipMapper = new FriendshipMapper();
  const friendRequestMapper = new FriendRequestMapper();
  const blockMapper = new BlockMapper();
  const videoStatusMapper = new VideoStatusMapper();
  const postMapper = new PostMapper();
  const hashtagMapper = new HashtagMapper();
  const conversationMapper = new ConversationMapper();
  const conversationMemberMapper = new ConversationMemberMapper();
  const chatMessageMapper = new ChatMessageMapper();
  const notificationMapper = new NotificationMapper();
  const otpMapper = new OtpMapper();
  const roleMapper = new RoleMapper();
  const permissionMapper = new PermissionMapper();

  const repositories = {
    userRepository: new UserRepository(db, dbClient, userMapper, logger),
    refreshTokenRepository: new RefreshTokenRepository(db, dbClient, refreshTokenMapper, logger),
    bookmarkRepository: new BookmarkRepository(db, dbClient, bookmarkMapper, logger),
    likeRepository: new LikeRepository(db, dbClient, likeMapper, logger),
    friendshipRepository: new FriendshipRepository(db, dbClient, friendshipMapper, logger),
    friendRequestRepository: new FriendRequestRepository(db, dbClient, friendRequestMapper, logger),
    blockRepository: new BlockRepository(db, dbClient, blockMapper, logger),
    videoStatusRepository: new VideoStatusRepository(db, dbClient, videoStatusMapper, logger),
    postRepository: new PostRepository(db, dbClient, postMapper, logger),
    hashtagRepository: new HashtagRepository(db, dbClient, hashtagMapper, logger),
    conversationRepository: new ConversationRepository(
      db,
      dbClient,
      conversationMapper,
      conversationMemberMapper,
      logger
    ),
    conversationMemberRepository: new ConversationMemberRepository(db, dbClient, conversationMemberMapper, logger),
    chatMessageRepository: new ChatMessageRepository(db, dbClient, chatMessageMapper, logger),
    notificationRepository: new NotificationRepository(db, dbClient, notificationMapper, logger),
    otpRepository: new OtpRepository(db, dbClient, otpMapper, logger),
    roleRepository: new RoleRepository(db, dbClient, roleMapper, logger),
    permissionRepository: new PermissionRepository(db, dbClient, permissionMapper, logger)
  };

  const queryRepositories = {
    postQueryRepository: new PostQueryRepository(db, dbClient, postMapper),
    userQueryRepository: new UserQueryRepository(db, dbClient, userMapper),
    conversationMemberQueryRepository: new ConversationMemberQueryRepository(db, dbClient)
  };

  const commandRepositories = {
    postCommandRepository: new PostCommandRepository(db, dbClient, postMapper)
  };

  return {
    ...repositories,
    ...queryRepositories,
    ...commandRepositories
  };
}
