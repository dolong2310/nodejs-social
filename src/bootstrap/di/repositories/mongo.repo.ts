import { ContainerRepositories } from '@/bootstrap/di/repositories';
import type { MongoDatabasePort } from '@/infrastructure/persistence/mongodb/database';
import { OtpRepository } from '@/modules/authentication/infrastructure/persistence/mongo/otp.impl.repository';
import { OtpMapper } from '@/modules/authentication/infrastructure/persistence/mongo/otp.mapper';
import { RefreshTokenRepository } from '@/modules/authentication/infrastructure/persistence/mongo/refresh-token.impl.repository';
import { RefreshTokenMapper } from '@/modules/authentication/infrastructure/persistence/mongo/refresh-token.mapper';
import { PermissionRepository } from '@/modules/authorization/infrastructure/persistence/mongo/permission.impl.repository';
import { PermissionMapper } from '@/modules/authorization/infrastructure/persistence/mongo/permission.mapper';
import { RoleQueryRepository } from '@/modules/authorization/infrastructure/persistence/mongo/role-query.impl.repository';
import { RoleRepository } from '@/modules/authorization/infrastructure/persistence/mongo/role.impl.repository';
import { RoleMapper } from '@/modules/authorization/infrastructure/persistence/mongo/role.mapper';
import { ChatMessageRepository } from '@/modules/conversation/infrastructure/persistence/mongo/chat-message.impl.repository';
import { ChatMessageMapper } from '@/modules/conversation/infrastructure/persistence/mongo/chat-message.mapper';
import { ConversationMemberQueryRepository } from '@/modules/conversation/infrastructure/persistence/mongo/conversation-member-query.impl.repository';
import { ConversationMemberRepository } from '@/modules/conversation/infrastructure/persistence/mongo/conversation-member.impl.repository';
import { ConversationMemberMapper } from '@/modules/conversation/infrastructure/persistence/mongo/conversation-member.mapper';
import { ConversationRepository } from '@/modules/conversation/infrastructure/persistence/mongo/conversation.impl.repository';
import { ConversationMapper } from '@/modules/conversation/infrastructure/persistence/mongo/conversation.mapper';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { VideoStatusRepository } from '@/modules/media/infrastructure/persistence/mongo/video-status.impl.repository';
import { VideoStatusMapper } from '@/modules/media/infrastructure/persistence/mongo/video-status.mapper';
import { NotificationRepository } from '@/modules/notification/infrastructure/persistence/mongo/notification.impl.repository';
import { NotificationMapper } from '@/modules/notification/infrastructure/persistence/mongo/notification.mapper';
import { BookmarkRepository } from '@/modules/post/infrastructure/persistence/mongo/bookmark.impl.repository';
import { BookmarkMapper } from '@/modules/post/infrastructure/persistence/mongo/bookmark.mapper';
import { HashtagRepository } from '@/modules/post/infrastructure/persistence/mongo/hashtag.impl.repository';
import { HashtagMapper } from '@/modules/post/infrastructure/persistence/mongo/hashtag.mapper';
import { LikeRepository } from '@/modules/post/infrastructure/persistence/mongo/like.impl.repository';
import { LikeMapper } from '@/modules/post/infrastructure/persistence/mongo/like.mapper';
import { PostCommandRepository } from '@/modules/post/infrastructure/persistence/mongo/post-command.impl.repository';
import { PostQueryRepository } from '@/modules/post/infrastructure/persistence/mongo/post-query.impl.repository';
import { PostRepository } from '@/modules/post/infrastructure/persistence/mongo/post.impl.repository';
import { PostMapper } from '@/modules/post/infrastructure/persistence/mongo/post.mapper';
import { BlockRepository } from '@/modules/relationship/infrastructure/persistence/mongo/block.impl.repository';
import { BlockMapper } from '@/modules/relationship/infrastructure/persistence/mongo/block.mapper';
import { FriendRequestRepository } from '@/modules/relationship/infrastructure/persistence/mongo/friend-request.impl.repository';
import { FriendRequestMapper } from '@/modules/relationship/infrastructure/persistence/mongo/friend-request.mapper';
import { FriendshipRepository } from '@/modules/relationship/infrastructure/persistence/mongo/friendship.impl.repository';
import { FriendshipMapper } from '@/modules/relationship/infrastructure/persistence/mongo/friendship.mapper';
import { UserQueryRepository } from '@/modules/user/infrastructure/persistence/mongo/user-query.impl.repository';
import { UserRepository } from '@/modules/user/infrastructure/persistence/mongo/user.impl.repository';
import { UserMapper } from '@/modules/user/infrastructure/persistence/mongo/user.mapper';

export function createMongoContainerRepositories(
  database: MongoDatabasePort,
  logger: LoggerPort
): ContainerRepositories {
  const db = database.db;
  const dbClient = database.dbClient;
  const readDb = database.readDb;
  const readDbClient = database.readDbClient;

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
    postQueryRepository: new PostQueryRepository(readDb, readDbClient, postMapper),
    userQueryRepository: new UserQueryRepository(readDb, readDbClient, userMapper, roleMapper),
    conversationMemberQueryRepository: new ConversationMemberQueryRepository(readDb, readDbClient),
    roleQueryRepository: new RoleQueryRepository(readDb, readDbClient, roleMapper)
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
