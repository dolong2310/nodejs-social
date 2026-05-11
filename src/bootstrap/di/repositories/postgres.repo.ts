import { ContainerRepositories } from '@/bootstrap/di/repositories';
import type { PostgresDatabasePort } from '@/infrastructure/persistence/postgres/database';
import { OtpRepository } from '@/modules/authentication/infrastructure/persistence/postgres/otp.impl.repository';
import { OtpMapper } from '@/modules/authentication/infrastructure/persistence/postgres/otp.mapper';
import { RefreshTokenRepository } from '@/modules/authentication/infrastructure/persistence/postgres/refresh-token.impl.repository';
import { RefreshTokenMapper } from '@/modules/authentication/infrastructure/persistence/postgres/refresh-token.mapper';
import { PermissionRepository } from '@/modules/authorization/infrastructure/persistence/postgres/permission.impl.repository';
import { PermissionMapper } from '@/modules/authorization/infrastructure/persistence/postgres/permission.mapper';
import { RoleQueryRepository } from '@/modules/authorization/infrastructure/persistence/postgres/role-query.impl.repository';
import { RoleRepository } from '@/modules/authorization/infrastructure/persistence/postgres/role.impl.repository';
import { RoleMapper } from '@/modules/authorization/infrastructure/persistence/postgres/role.mapper';
import { ChatMessageRepository } from '@/modules/conversation/infrastructure/persistence/postgres/chat-message.impl.repository';
import { ChatMessageMapper } from '@/modules/conversation/infrastructure/persistence/postgres/chat-message.mapper';
import { ConversationMemberQueryRepository } from '@/modules/conversation/infrastructure/persistence/postgres/conversation-member-query.impl.repository';
import { ConversationMemberRepository } from '@/modules/conversation/infrastructure/persistence/postgres/conversation-member.impl.repository';
import { ConversationMemberMapper } from '@/modules/conversation/infrastructure/persistence/postgres/conversation-member.mapper';
import { ConversationRepository } from '@/modules/conversation/infrastructure/persistence/postgres/conversation.impl.repository';
import { ConversationMapper } from '@/modules/conversation/infrastructure/persistence/postgres/conversation.mapper';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { VideoStatusRepository } from '@/modules/media/infrastructure/persistence/postgres/video-status.impl.repository';
import { VideoStatusMapper } from '@/modules/media/infrastructure/persistence/postgres/video-status.mapper';
import { NotificationRepository } from '@/modules/notification/infrastructure/persistence/postgres/notification.impl.repository';
import { NotificationMapper } from '@/modules/notification/infrastructure/persistence/postgres/notification.mapper';
import { BookmarkRepository } from '@/modules/post/infrastructure/persistence/postgres/bookmark.impl.repository';
import { BookmarkMapper } from '@/modules/post/infrastructure/persistence/postgres/bookmark.mapper';
import { HashtagRepository } from '@/modules/post/infrastructure/persistence/postgres/hashtag.impl.repository';
import { HashtagMapper } from '@/modules/post/infrastructure/persistence/postgres/hashtag.mapper';
import { LikeRepository } from '@/modules/post/infrastructure/persistence/postgres/like.impl.repository';
import { LikeMapper } from '@/modules/post/infrastructure/persistence/postgres/like.mapper';
import { PostCommandRepository } from '@/modules/post/infrastructure/persistence/postgres/post-command.impl.repository';
import { PostQueryRepository } from '@/modules/post/infrastructure/persistence/postgres/post-query.impl.repository';
import { PostRepository } from '@/modules/post/infrastructure/persistence/postgres/post.impl.repository';
import { PostMapper } from '@/modules/post/infrastructure/persistence/postgres/post.mapper';
import { BlockRepository } from '@/modules/relationship/infrastructure/persistence/postgres/block.impl.repository';
import { BlockMapper } from '@/modules/relationship/infrastructure/persistence/postgres/block.mapper';
import { FriendRequestRepository } from '@/modules/relationship/infrastructure/persistence/postgres/friend-request.impl.repository';
import { FriendRequestMapper } from '@/modules/relationship/infrastructure/persistence/postgres/friend-request.mapper';
import { FriendshipRepository } from '@/modules/relationship/infrastructure/persistence/postgres/friendship.impl.repository';
import { FriendshipMapper } from '@/modules/relationship/infrastructure/persistence/postgres/friendship.mapper';
import { UserQueryRepository } from '@/modules/user/infrastructure/persistence/postgres/user-query.impl.repository';
import { UserRepository } from '@/modules/user/infrastructure/persistence/postgres/user.impl.repository';
import { UserMapper } from '@/modules/user/infrastructure/persistence/postgres/user.mapper';

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
    postCommandRepository: new PostCommandRepository(database.pool, postMapper)
  };

  return {
    ...repositories,
    ...queryRepositories,
    ...commandRepositories
  };
}
