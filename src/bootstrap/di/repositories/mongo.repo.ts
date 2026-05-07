import { ContainerRepositories } from '@/bootstrap/di/repositories';
import type { MongoDatabasePort } from '@/infrastructure/persistence/mongodb/database';
import { OtpRepository } from '@/modules/auth/infrastructure/mongo/otp.impl.repository';
import { OtpMapper } from '@/modules/auth/infrastructure/mongo/otp.mapper';
import { RefreshTokenRepository } from '@/modules/auth/infrastructure/mongo/refresh-token.impl.repository';
import { RefreshTokenMapper } from '@/modules/auth/infrastructure/mongo/refresh-token.mapper';
import { BlockRepository } from '@/modules/block/infrastructure/mongo/block.impl.repository';
import { BlockMapper } from '@/modules/block/infrastructure/mongo/block.mapper';
import { BookmarkRepository } from '@/modules/bookmark/infrastructure/mongo/bookmark.impl.repository';
import { BookmarkMapper } from '@/modules/bookmark/infrastructure/mongo/bookmark.mapper';
import { ChatMessageRepository } from '@/modules/conversation/infrastructure/mongo/chat-message.impl.repository';
import { ChatMessageMapper } from '@/modules/conversation/infrastructure/mongo/chat-message.mapper';
import { ConversationMemberQueryRepository } from '@/modules/conversation/infrastructure/mongo/conversation-member-query.impl.repository';
import { ConversationMemberRepository } from '@/modules/conversation/infrastructure/mongo/conversation-member.impl.repository';
import { ConversationMemberMapper } from '@/modules/conversation/infrastructure/mongo/conversation-member.mapper';
import { ConversationRepository } from '@/modules/conversation/infrastructure/mongo/conversation.impl.repository';
import { ConversationMapper } from '@/modules/conversation/infrastructure/mongo/conversation.mapper';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { FriendRequestRepository } from '@/modules/friend/infrastructure/mongo/friend-request.impl.repository';
import { FriendRequestMapper } from '@/modules/friend/infrastructure/mongo/friend-request.mapper';
import { FriendshipRepository } from '@/modules/friend/infrastructure/mongo/friendship.impl.repository';
import { FriendshipMapper } from '@/modules/friend/infrastructure/mongo/friendship.mapper';
import { HashtagRepository } from '@/modules/hashtag/infrastructure/mongo/hashtag.impl.repository';
import { HashtagMapper } from '@/modules/hashtag/infrastructure/mongo/hashtag.mapper';
import { LikeRepository } from '@/modules/like/infrastructure/mongo/like.impl.repository';
import { LikeMapper } from '@/modules/like/infrastructure/mongo/like.mapper';
import { VideoStatusRepository } from '@/modules/media/infrastructure/mongo/video-status.impl.repository';
import { VideoStatusMapper } from '@/modules/media/infrastructure/mongo/video-status.mapper';
import { NotificationRepository } from '@/modules/notification/infrastructure/mongo/notification.impl.repository';
import { NotificationMapper } from '@/modules/notification/infrastructure/mongo/notification.mapper';
import { PermissionRepository } from '@/modules/permission/infrastructure/mongo/permission.impl.repository';
import { PermissionMapper } from '@/modules/permission/infrastructure/mongo/permission.mapper';
import { PostCommandRepository } from '@/modules/post/infrastructure/mongo/post-command.impl.repository';
import { PostQueryRepository } from '@/modules/post/infrastructure/mongo/post-query.impl.repository';
import { PostRepository } from '@/modules/post/infrastructure/mongo/post.impl.repository';
import { PostMapper } from '@/modules/post/infrastructure/mongo/post.mapper';
import { RoleQueryRepository } from '@/modules/role/infrastructure/mongo/role-query.impl.repository';
import { RoleRepository } from '@/modules/role/infrastructure/mongo/role.impl.repository';
import { RoleMapper } from '@/modules/role/infrastructure/mongo/role.mapper';
import { UserQueryRepository } from '@/modules/user/infrastructure/mongo/user-query.impl.repository';
import { UserRepository } from '@/modules/user/infrastructure/mongo/user.impl.repository';
import { UserMapper } from '@/modules/user/infrastructure/mongo/user.mapper';

export function createMongoContainerRepositories(
  database: MongoDatabasePort,
  logger: LoggerPort
): ContainerRepositories {
  const { db, dbClient } = database;
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
    conversationMemberQueryRepository: new ConversationMemberQueryRepository(db, dbClient),
    roleQueryRepository: new RoleQueryRepository(db, dbClient, roleMapper)
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
