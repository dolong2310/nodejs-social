import { createMongoContainerRepositories } from '@/bootstrap/di/repositories/mongo.repo';
import { createPostgresContainerRepositories } from '@/bootstrap/di/repositories/postgres.repo';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { EnumDatabaseDriver, type DatabasePort } from '@/infrastructure/persistence/database.port';
import type { MongoDatabasePort } from '@/infrastructure/persistence/mongodb/database';
import type { PostgresDatabasePort } from '@/infrastructure/persistence/postgres/database';
import type { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import type { RefreshTokenRepositoryPort } from '@/modules/authentication/domain/repositories/refresh-token.repository';
import type { PermissionRepositoryPort } from '@/modules/authorization/domain/repositories/permission.repository';
import type { RoleQueryRepositoryPort } from '@/modules/authorization/domain/repositories/role.query.repository';
import type { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import type { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';
import type { ConversationMemberQueryRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.query.repository';
import type { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import type { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import type { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import type { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import type { PaymentRepositoryPort } from '@/modules/payment/domain/repositories/payment.repository';
import type { BookmarkRepositoryPort } from '@/modules/post/domain/repositories/bookmark.repository';
import type { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';
import type { LikeRepositoryPort } from '@/modules/post/domain/repositories/like.repository';
import type { PostCommandRepositoryPort } from '@/modules/post/domain/repositories/post.command.repository';
import type { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import type { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import type { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';
import type { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';
import type { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';
import type { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import type { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

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
  paymentRepository: PaymentRepositoryPort;
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
