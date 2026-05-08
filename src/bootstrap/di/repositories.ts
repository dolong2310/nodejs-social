import { createMongoContainerRepositories } from '@/bootstrap/di/repositories/mongo.repo';
import { createPostgresContainerRepositories } from '@/bootstrap/di/repositories/postgres.repo';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { EnumDatabaseDriver, type DatabasePort } from '@/infrastructure/persistence/database.port';
import type { MongoDatabasePort } from '@/infrastructure/persistence/mongodb/database';
import type { PostgresDatabasePort } from '@/infrastructure/persistence/postgres/database';
import { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import { RefreshTokenRepositoryPort } from '@/modules/authentication/domain/repositories/refresh-token.repository';
import { PermissionRepositoryPort } from '@/modules/authorization/domain/repositories/permission.repository';
import { RoleQueryRepositoryPort } from '@/modules/authorization/domain/repositories/role.query.repository';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';
import { ConversationMemberQueryRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.query.repository';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import { BookmarkRepositoryPort } from '@/modules/post/domain/repositories/bookmark.repository';
import { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';
import { LikeRepositoryPort } from '@/modules/post/domain/repositories/like.repository';
import { PostCommandRepositoryPort } from '@/modules/post/domain/repositories/post.command.repository';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';
import { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
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
