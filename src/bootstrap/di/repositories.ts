import { createMongoContainerRepositories } from '@/bootstrap/di/repositories/mongo.repo';
import { createPostgresContainerRepositories } from '@/bootstrap/di/repositories/postgres.repo';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { EnumDatabaseDriver, type DatabasePort } from '@/infrastructure/persistence/database.port';
import type { MongoDatabasePort } from '@/infrastructure/persistence/mongodb/database';
import type { PostgresDatabasePort } from '@/infrastructure/persistence/postgres/database';
import { OtpRepositoryPort } from '@/modules/auth/domain/repositories/otp.repository';
import { RefreshTokenRepositoryPort } from '@/modules/auth/domain/repositories/refresh-token.repository';
import { BlockRepositoryPort } from '@/modules/block/domain/repositories/block.repository';
import { BookmarkRepositoryPort } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { ConversationMemberQueryRepositoryPort } from '@/modules/conversation/application/ports/queries/conversation-member-query.repository';
import { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { FriendRequestRepositoryPort } from '@/modules/friend/domain/repositories/friend-request.repository';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';
import { HashtagRepositoryPort } from '@/modules/hashtag/domain/repositories/hashtag.repository';
import { LikeRepositoryPort } from '@/modules/like/domain/repositories/like.repository';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import { PermissionRepositoryPort } from '@/modules/permission/domain/repositories/permission.repository';
import { PostCommandRepositoryPort } from '@/modules/post/application/ports/command/post-command.repository';
import { PostQueryRepositoryPort } from '@/modules/post/application/ports/queries/post-query.repository';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import { RoleQueryRepositoryPort } from '@/modules/role/application/ports/queries/role-query.repository';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';
import { UserQueryRepositoryPort } from '@/modules/user/application/ports/queries/user-query.repository';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

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
  roleQueryRepository: RoleQueryRepositoryPort;
};

export type ContainerRepositories = Repositories & QueryRepositories;

export function createContainerRepositories(database: DatabasePort, logger: LoggerPort): ContainerRepositories {
  switch (dbConfig.driver) {
    case EnumDatabaseDriver.POSTGRES: {
      return createPostgresContainerRepositories(database as PostgresDatabasePort, logger);
    }

    case EnumDatabaseDriver.MONGO: {
      return createMongoContainerRepositories(database as MongoDatabasePort, logger);
    }

    default: {
      throw new Error(`Unsupported database driver: ${dbConfig.driver}`);
    }
  }
}
