import { ContainerRepositories } from '@/bootstrap/di/repositories';
import type { PostgresDatabasePort } from '@/infrastructure/persistence/postgres/database';
import { OtpRepository } from '@/modules/auth/infrastructure/postgres/otp.impl.repository';
import { OtpMapper } from '@/modules/auth/infrastructure/postgres/otp.mapper';
import { RefreshTokenRepository } from '@/modules/auth/infrastructure/postgres/refresh-token.impl.repository';
import { RefreshTokenMapper } from '@/modules/auth/infrastructure/postgres/refresh-token.mapper';
import { BlockRepository } from '@/modules/block/infrastructure/postgres/block.impl.repository';
import { BlockMapper } from '@/modules/block/infrastructure/postgres/block.mapper';
import { BookmarkRepository } from '@/modules/bookmark/infrastructure/postgres/bookmark.impl.repository';
import { BookmarkMapper } from '@/modules/bookmark/infrastructure/postgres/bookmark.mapper';
import { ChatMessageRepository } from '@/modules/conversation/infrastructure/postgres/chat-message.impl.repository';
import { ChatMessageMapper } from '@/modules/conversation/infrastructure/postgres/chat-message.mapper';
import { ConversationMemberQueryRepository } from '@/modules/conversation/infrastructure/postgres/conversation-member-query.impl.repository';
import { ConversationMemberRepository } from '@/modules/conversation/infrastructure/postgres/conversation-member.impl.repository';
import { ConversationMemberMapper } from '@/modules/conversation/infrastructure/postgres/conversation-member.mapper';
import { ConversationRepository } from '@/modules/conversation/infrastructure/postgres/conversation.impl.repository';
import { ConversationMapper } from '@/modules/conversation/infrastructure/postgres/conversation.mapper';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { FriendRequestRepository } from '@/modules/friend/infrastructure/postgres/friend-request.impl.repository';
import { FriendRequestMapper } from '@/modules/friend/infrastructure/postgres/friend-request.mapper';
import { FriendshipRepository } from '@/modules/friend/infrastructure/postgres/friendship.impl.repository';
import { FriendshipMapper } from '@/modules/friend/infrastructure/postgres/friendship.mapper';
import { HashtagRepository } from '@/modules/hashtag/infrastructure/postgres/hashtag.impl.repository';
import { HashtagMapper } from '@/modules/hashtag/infrastructure/postgres/hashtag.mapper';
import { LikeRepository } from '@/modules/like/infrastructure/postgres/like.impl.repository';
import { LikeMapper } from '@/modules/like/infrastructure/postgres/like.mapper';
import { VideoStatusRepository } from '@/modules/media/infrastructure/postgres/video-status.impl.repository';
import { VideoStatusMapper } from '@/modules/media/infrastructure/postgres/video-status.mapper';
import { NotificationRepository } from '@/modules/notification/infrastructure/postgres/notification.impl.repository';
import { NotificationMapper } from '@/modules/notification/infrastructure/postgres/notification.mapper';
import { PermissionRepository } from '@/modules/permission/infrastructure/postgres/permission.impl.repository';
import { PermissionMapper } from '@/modules/permission/infrastructure/postgres/permission.mapper';
import { PostCommandRepository } from '@/modules/post/infrastructure/postgres/post-command.impl.repository';
import { PostQueryRepository } from '@/modules/post/infrastructure/postgres/post-query.impl.repository';
import { PostRepository } from '@/modules/post/infrastructure/postgres/post.impl.repository';
import { PostMapper } from '@/modules/post/infrastructure/postgres/post.mapper';
import { RoleQueryRepository } from '@/modules/role/infrastructure/postgres/role-query.impl.repository';
import { RoleRepository } from '@/modules/role/infrastructure/postgres/role.impl.repository';
import { RoleMapper } from '@/modules/role/infrastructure/postgres/role.mapper';
import { UserQueryRepository } from '@/modules/user/infrastructure/postgres/user-query.impl.repository';
import { UserRepository } from '@/modules/user/infrastructure/postgres/user.impl.repository';
import { UserMapper } from '@/modules/user/infrastructure/postgres/user.mapper';

export function createPostgresContainerRepositories(
  database: PostgresDatabasePort,
  logger: LoggerPort
): ContainerRepositories {
  const userMapper = new UserMapper();
  const refreshTokenMapper = new RefreshTokenMapper();
  const otpMapper = new OtpMapper();
  const permissionMapper = new PermissionMapper();
  const roleMapper = new RoleMapper();
  const blockMapper = new BlockMapper();
  const friendshipMapper = new FriendshipMapper();
  const friendRequestMapper = new FriendRequestMapper();
  const hashtagMapper = new HashtagMapper();
  const likeMapper = new LikeMapper();
  const bookmarkMapper = new BookmarkMapper();
  const postMapper = new PostMapper();
  const notificationMapper = new NotificationMapper();
  const conversationMapper = new ConversationMapper();
  const conversationMemberMapper = new ConversationMemberMapper();
  const chatMessageMapper = new ChatMessageMapper();
  const videoStatusMapper = new VideoStatusMapper();

  const repositories = {
    userRepository: new UserRepository(database.pool, userMapper, logger),
    refreshTokenRepository: new RefreshTokenRepository(database.pool, refreshTokenMapper, logger),
    otpRepository: new OtpRepository(database.pool, otpMapper, logger),
    permissionRepository: new PermissionRepository(database.pool, permissionMapper, logger),
    roleRepository: new RoleRepository(database.pool, roleMapper, logger),
    blockRepository: new BlockRepository(database.pool, blockMapper, logger),
    friendshipRepository: new FriendshipRepository(database.pool, friendshipMapper, logger),
    friendRequestRepository: new FriendRequestRepository(database.pool, friendRequestMapper, logger),
    hashtagRepository: new HashtagRepository(database.pool, hashtagMapper, logger),
    likeRepository: new LikeRepository(database.pool, likeMapper, logger),
    bookmarkRepository: new BookmarkRepository(database.pool, bookmarkMapper, logger),
    postRepository: new PostRepository(database.pool, postMapper, logger),
    notificationRepository: new NotificationRepository(database.pool, notificationMapper, logger),
    conversationRepository: new ConversationRepository(
      database.pool,
      conversationMapper,
      conversationMemberMapper,
      logger
    ),
    conversationMemberRepository: new ConversationMemberRepository(database.pool, conversationMemberMapper, logger),
    chatMessageRepository: new ChatMessageRepository(database.pool, chatMessageMapper, logger),
    videoStatusRepository: new VideoStatusRepository(database.pool, videoStatusMapper, logger)
  };

  const queryRepositories = {
    userQueryRepository: new UserQueryRepository(database.pool, userMapper),
    postQueryRepository: new PostQueryRepository(database.pool),
    conversationMemberQueryRepository: new ConversationMemberQueryRepository(database.pool),
    roleQueryRepository: new RoleQueryRepository(database.pool)
  };

  const commandRepositories = {
    postCommandRepository: new PostCommandRepository(database.pool)
  };

  return {
    ...repositories,
    ...queryRepositories,
    ...commandRepositories
  };
}
