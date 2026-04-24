import { LoggerPort } from '@/application/ports/logger.port';
import { BlockRepositoryPort } from '@/domain/repositories/block/block.repository';
import { BookmarkRepositoryPort } from '@/domain/repositories/bookmark/bookmark.repository';
import { ChatMessageRepositoryPort } from '@/domain/repositories/chat-message/chat-message.repository';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';
import { ConversationRepositoryPort } from '@/domain/repositories/conversation/conversation.repository';
import { FriendRequestRepositoryPort } from '@/domain/repositories/friend-request/friend-request.repository';
import { FriendshipRepositoryPort } from '@/domain/repositories/friendship/friendship.repository';
import { HashtagRepositoryPort } from '@/domain/repositories/hashtag/hashtag.repository';
import { LikeRepositoryPort } from '@/domain/repositories/like/like.repository';
import { NotificationRepositoryPort } from '@/domain/repositories/notification/notification.repository';
import { OtpRepositoryPort } from '@/domain/repositories/otp/otp.repository';
import { PostRepositoryPort } from '@/domain/repositories/post/post.repository';
import { RefreshTokenRepositoryPort } from '@/domain/repositories/refresh-token/refresh-token.repository';
import { RoleRepositoryPort } from '@/domain/repositories/role/role.repository';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';
import { VideoStatusRepositoryPort } from '@/domain/repositories/video-status/video-status.repository';
import { BlockRepository } from '@/infrastructure/persistence/repositories/block/block.impl.repository';
import { BlockMapper } from '@/infrastructure/persistence/repositories/block/block.mapper';
import { BookmarkRepository } from '@/infrastructure/persistence/repositories/bookmark/bookmark.impl.repository';
import { BookmarkMapper } from '@/infrastructure/persistence/repositories/bookmark/bookmark.mapper';
import { ChatMessageMapper } from '@/infrastructure/persistence/repositories/chat-message/chat-message.mapper';
import { ChatMessageRepository } from '@/infrastructure/persistence/repositories/chat-message/chat-messages.impl.repository';
import { ConversationMemberRepository } from '@/infrastructure/persistence/repositories/conversation-member/conversation-member.impl.repository';
import { ConversationMemberMapper } from '@/infrastructure/persistence/repositories/conversation-member/conversation-member.mapper';
import { ConversationRepository } from '@/infrastructure/persistence/repositories/conversation/conversation.impl.repository';
import { ConversationMapper } from '@/infrastructure/persistence/repositories/conversation/conversation.mapper';
import { FriendRequestRepository } from '@/infrastructure/persistence/repositories/friend-request/friend-request.impl.repository';
import { FriendRequestMapper } from '@/infrastructure/persistence/repositories/friend-request/friend-request.mapper';
import { FriendshipRepository } from '@/infrastructure/persistence/repositories/friendship/friendship.impl.repository';
import { FriendshipMapper } from '@/infrastructure/persistence/repositories/friendship/friendship.mapper';
import { HashtagRepository } from '@/infrastructure/persistence/repositories/hashtag/hashtag.impl.repository';
import { HashtagMapper } from '@/infrastructure/persistence/repositories/hashtag/hashtag.mapper';
import { LikeRepository } from '@/infrastructure/persistence/repositories/like/like.impl.repository';
import { LikeMapper } from '@/infrastructure/persistence/repositories/like/like.mapper';
import { NotificationRepository } from '@/infrastructure/persistence/repositories/notification/notification.impl.repository';
import { NotificationMapper } from '@/infrastructure/persistence/repositories/notification/notification.mapper';
import { OtpRepository } from '@/infrastructure/persistence/repositories/otp/otp.impl.repository';
import { OtpMapper } from '@/infrastructure/persistence/repositories/otp/otp.mapper';
import { PostRepository } from '@/infrastructure/persistence/repositories/post/post.impl.repository';
import { PostMapper } from '@/infrastructure/persistence/repositories/post/post.mapper';
import { RefreshTokenRepository } from '@/infrastructure/persistence/repositories/refresh-token/refresh-token.impl.repository';
import { RefreshTokenMapper } from '@/infrastructure/persistence/repositories/refresh-token/refresh-token.mapper';
import { RoleRepository } from '@/infrastructure/persistence/repositories/role/role.impl.repository';
import { RoleMapper } from '@/infrastructure/persistence/repositories/role/role.mapper';
import { UserRepository } from '@/infrastructure/persistence/repositories/user/user.impl.repository';
import { UserMapper } from '@/infrastructure/persistence/repositories/user/user.mapper';
import { VideoStatusRepository } from '@/infrastructure/persistence/repositories/video-status/video-status.impl.repository';
import { VideoStatusMapper } from '@/infrastructure/persistence/repositories/video-status/video-status.mapper';
import { Db, MongoClient } from 'mongodb';

export type ContainerRepositories = {
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
};

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

  return {
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
    roleRepository: new RoleRepository(db, dbClient, roleMapper, logger)
  };
}
