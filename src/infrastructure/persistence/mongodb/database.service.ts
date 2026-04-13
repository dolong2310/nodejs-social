import { IBlockModel } from '@/infrastructure/persistence/mongodb/models/block.model';
import { IBookmarkModel } from '@/infrastructure/persistence/mongodb/models/bookmark.model';
import { IChatMessageModel } from '@/infrastructure/persistence/mongodb/models/chat-message.model';
import { IConversationMemberModel } from '@/infrastructure/persistence/mongodb/models/conversation-member.model';
import { IConversationModel } from '@/infrastructure/persistence/mongodb/models/conversation.model';
import { IFriendRequestModel } from '@/infrastructure/persistence/mongodb/models/friend-request.model';
import { IFriendshipModel } from '@/infrastructure/persistence/mongodb/models/friendship.model';
import { IHashtagModel } from '@/infrastructure/persistence/mongodb/models/hashtag.model';
import { ILikeModel } from '@/infrastructure/persistence/mongodb/models/like.model';
import { INotificationModel } from '@/infrastructure/persistence/mongodb/models/notification.model';
import { IPostModel } from '@/infrastructure/persistence/mongodb/models/post.model';
import { IRefreshTokenModel } from '@/infrastructure/persistence/mongodb/models/refresh-token.model';
import { IUserModel } from '@/infrastructure/persistence/mongodb/models/user.model';
import { IVideoStatusModel } from '@/infrastructure/persistence/mongodb/models/video-status.model';

import logger from '@/infrastructure/logger/create-logger';
import { ConnectionService } from '@/infrastructure/persistence/connection.abstract';

import { ClientSession, Collection, Db, Document, MongoClient } from 'mongodb';

const log = logger.child({ module: 'database-service' });

export interface IDatabaseService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  createUsersIndex(): Promise<void>;
  createRefreshTokensIndex(): Promise<void>;
  createVideoStatusesIndex(): Promise<void>;
  createFriendshipIndexes(): Promise<void>;
  createFriendRequestIndexes(): Promise<void>;
  createBlockIndexes(): Promise<void>;
  createPostsIndex(): Promise<void>;
  createNotificationIndexes(): Promise<void>;
  initializeConversationIndexes(): Promise<void>;
  createTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T>;
}

export class DatabaseService extends ConnectionService implements IDatabaseService {
  private client: MongoClient;
  private db: Db;
  private chatDb: Db;

  constructor(readonly config: { uri: string; databaseName: string; chatDatabaseName: string }) {
    super();
    this.client = new MongoClient(config.uri);
    this.db = this.client.db(config.databaseName);
    this.chatDb = this.client.db(config.chatDatabaseName);
  }

  async createTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = this.client.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 });
    } catch (error) {
      log.error({ err: error }, 'error connecting to social database');
      await this.disconnect();
      throw error;
    }
    try {
      await this.chatDb.command({ ping: 1 });
    } catch (error) {
      log.error({ err: error }, 'error connecting to chat database');
      await this.disconnect();
      throw error;
    }
    log.info(
      { socialDatabase: this.db.databaseName, chatDatabase: this.chatDb.databaseName },
      'connected to mongodb databases'
    );
  }

  protected async releaseConnection(): Promise<void> {
    await this.client.close();
  }

  /** `indexExists` throws NamespaceNotFound (26) when the collection has never been created. */
  private async indexExistsSafe<T extends Document>(collection: Collection<T>, indexNames: string[]): Promise<boolean> {
    try {
      return await collection.indexExists(indexNames);
    } catch (error: unknown) {
      const code = (error as { code?: number })?.code;
      if (code === 26) return false;
      throw error;
    }
  }

  async createUsersIndex() {
    const isIndexExists = await this.indexExistsSafe(this.users, ['email_1_password_1', 'username_1', 'email_1']);
    if (isIndexExists) return;
    await Promise.all([
      this.users.createIndex({ email: 1, password: 1 }),
      this.users.createIndex({ username: 1 }, { unique: true }),
      this.users.createIndex({ email: 1 }, { unique: true })
    ]);
  }

  async createRefreshTokensIndex() {
    const isIndexExists = await this.indexExistsSafe(this.refreshTokens, ['token_1', 'exp_1']);
    if (isIndexExists) return;
    await Promise.all([
      this.refreshTokens.createIndex({ token: 1 }),
      this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 }) // mongodb will automatically delete the document after the expiration time because mongodb has background job to delete the document after the expiration time
    ]);
  }

  async createVideoStatusesIndex() {
    const isIndexExists = await this.indexExistsSafe(this.videoStatuses, ['name_1']);
    if (isIndexExists) return;
    await this.videoStatuses.createIndex({ name: 1 });
  }

  async createFriendshipIndexes() {
    const isIndexExists = await this.indexExistsSafe(this.friendships, ['userIdLow_1_userIdHigh_1']);
    if (isIndexExists) return;
    await Promise.all([
      this.friendships.createIndex({ userIdLow: 1, userIdHigh: 1 }, { unique: true }),
      this.friendships.createIndex({ userIdLow: 1 }),
      this.friendships.createIndex({ userIdHigh: 1 })
    ]);
  }

  async createFriendRequestIndexes() {
    const isIndexExists = await this.indexExistsSafe(this.friendRequests, ['fromUserId_1_toUserId_1']);
    if (isIndexExists) return;
    await Promise.all([
      this.friendRequests.createIndex({ fromUserId: 1, toUserId: 1 }, { unique: true }),
      this.friendRequests.createIndex({ toUserId: 1, createdAt: -1 }),
      this.friendRequests.createIndex({ fromUserId: 1, createdAt: -1 }),
      // UTC-day cap counts (D-07): range on createdAt for fixed fromUserId
      this.friendRequests.createIndex({ fromUserId: 1, createdAt: 1 })
    ]);
  }

  async createBlockIndexes() {
    const isIndexExists = await this.indexExistsSafe(this.blocks, ['blockerId_1_blockedId_1']);
    if (isIndexExists) return;
    await Promise.all([
      this.blocks.createIndex({ blockerId: 1, blockedId: 1 }, { unique: true }),
      this.blocks.createIndex({ blockerId: 1 }),
      this.blocks.createIndex({ blockedId: 1 })
    ]);
  }

  async createPostsIndex() {
    const isIndexExists = await this.indexExistsSafe(this.posts, ['content_text']);
    if (isIndexExists) return;
    await this.posts.createIndex({ content: 'text' }, { default_language: 'none' });
  }

  async createPostsAdditionalIndexes() {
    await Promise.all([
      // For findPostsType / countPostsType queries: { parentId, type }
      // Also used by the $lookup self-join in aggregation pipelines that counts child posts (comments/reposts/quotes)
      this.posts.createIndex({ parentId: 1, type: 1 }, { sparse: true }),
      // For cursor-based findPostsType query: match { parentId, type } + sort/filter by createdAt, _id
      this.posts.createIndex({ parentId: 1, type: 1, createdAt: -1, _id: -1 }, { sparse: true }),
      // For new-feed queries: { userId: { $in: [...] }, $or: [audience conditions] }
      this.posts.createIndex({ userId: 1, audience: 1 }),
      // For guest feed & audience-only filters: { audience }
      this.posts.createIndex({ audience: 1 }),
      // For guest cursor feeds: match audience + sort/filter by createdAt, _id
      this.posts.createIndex({ audience: 1, createdAt: -1, _id: -1 })
    ]);
  }

  async createBookmarksIndex() {
    await Promise.all([
      // For bookmark create (upsert) and delete: { userId, postId } — also prevents duplicate bookmarks
      this.bookmarks.createIndex({ userId: 1, postId: 1 }, { unique: true }),
      // For the $lookup in post aggregation pipelines that calculates bookmarkCount per post
      this.bookmarks.createIndex({ postId: 1 })
    ]);
  }

  async createLikesIndex() {
    await Promise.all([
      this.likes.createIndex({ userId: 1, postId: 1 }, { unique: true }),
      this.likes.createIndex({ postId: 1 })
    ]);
  }

  async createHashtagsIndex() {
    // For findAndUpsertHashtags upsert filter and find-by-name queries
    await this.hashtags.createIndex({ name: 1 }, { unique: true });
  }

  /** Search posts: filters on audience + media.type (video / image) combine often in $match. */
  async createSearchPostsAudienceMediaIndex() {
    const name = 'audience_1_media.type_1';
    if (await this.indexExistsSafe(this.posts, [name])) return;
    await this.posts.createIndex({ audience: 1, 'media.type': 1 }, { name });
  }

  async createUsersSearchIndex() {
    const isIndexExists = await this.indexExistsSafe(this.users, ['name_1_username_1_email_1']);
    if (isIndexExists) return;
    await this.users.createIndex({ name: 'text', username: 'text', email: 'text' }, { default_language: 'none' });
  }

  async initializeIndexes() {
    await Promise.all([
      this.createUsersIndex(),
      this.createUsersSearchIndex(),
      this.createRefreshTokensIndex(),
      this.createVideoStatusesIndex(),
      this.createFriendshipIndexes(),
      this.createFriendRequestIndexes(),
      this.createBlockIndexes(),
      this.createPostsIndex(),
      this.createPostsAdditionalIndexes(),
      this.createSearchPostsAudienceMediaIndex(),
      this.createBookmarksIndex(),
      this.createLikesIndex(),
      this.createHashtagsIndex(),
      this.createNotificationIndexes()
    ]);
  }

  async createNotificationIndexes() {
    const col = this.notifications;
    const listIdx = 'recipientId_1_createdAt_-1__id_-1';
    if (!(await this.indexExistsSafe(col, [listIdx]))) {
      await col.createIndex({ recipientId: 1, createdAt: -1, _id: -1 }, { name: listIdx });
    }
  }

  /** Chat DB — idempotent indexes (Phase 4). Collection names unchanged: conversations, conversationMembers, messages. */
  async initializeConversationIndexes(): Promise<void> {
    await Promise.all([
      this._ensureConversationDocumentsIndexes(),
      this._ensureConversationMembersIndexes(),
      this._ensureChatMessagesIndexes()
    ]);
  }

  private async _ensureConversationDocumentsIndexes(): Promise<void> {
    const col = this.conversations;
    const directPair = 'userIdLow_1_userIdHigh_1';
    if (!(await this.indexExistsSafe(col, [directPair]))) {
      await col.createIndex(
        { userIdLow: 1, userIdHigh: 1 },
        { unique: true, partialFilterExpression: { type: 'direct' } }
      );
    }
    const updated = 'updatedAt_-1';
    if (!(await this.indexExistsSafe(col, [updated]))) {
      await col.createIndex({ updatedAt: -1 });
    }
  }

  private async _ensureConversationMembersIndexes(): Promise<void> {
    const col = this.conversationMembers;
    const uniq = 'conversationId_1_userId_1';
    if (!(await this.indexExistsSafe(col, [uniq]))) {
      await col.createIndex({ conversationId: 1, userId: 1 }, { unique: true });
    }
    const byUser = 'userId_1_conversationId_1';
    if (!(await this.indexExistsSafe(col, [byUser]))) {
      await col.createIndex({ userId: 1, conversationId: 1 });
    }

    const byChatRole = 'conversationId_1_role_1';
    if (!(await this.indexExistsSafe(col, [byChatRole]))) {
      await col.createIndex({ conversationId: 1, role: 1 });
    }
  }

  private async _ensureChatMessagesIndexes(): Promise<void> {
    const col = this.chatMessages;
    const history = 'conversationId_1_createdAt_-1__id_-1';
    if (!(await this.indexExistsSafe(col, [history]))) {
      await col.createIndex({ conversationId: 1, createdAt: -1, _id: -1 }, { name: history });
    }
  }

  get users(): Collection<IUserModel> {
    return this.db.collection<IUserModel>('users');
  }

  get refreshTokens(): Collection<IRefreshTokenModel> {
    return this.db.collection<IRefreshTokenModel>('refreshTokens');
  }

  get friendships(): Collection<IFriendshipModel> {
    return this.db.collection<IFriendshipModel>('friendships');
  }

  get friendRequests(): Collection<IFriendRequestModel> {
    return this.db.collection<IFriendRequestModel>('friendRequests');
  }

  get blocks(): Collection<IBlockModel> {
    return this.db.collection<IBlockModel>('blocks');
  }

  get videoStatuses(): Collection<IVideoStatusModel> {
    return this.db.collection<IVideoStatusModel>('videoStatuses');
  }

  get posts(): Collection<IPostModel> {
    return this.db.collection<IPostModel>('posts');
  }

  get hashtags(): Collection<IHashtagModel> {
    return this.db.collection<IHashtagModel>('hashtags');
  }

  get bookmarks(): Collection<IBookmarkModel> {
    return this.db.collection<IBookmarkModel>('bookmarks');
  }

  get likes(): Collection<ILikeModel> {
    return this.db.collection<ILikeModel>('likes');
  }

  get notifications(): Collection<INotificationModel> {
    return this.db.collection<INotificationModel>('notifications');
  }

  get conversations(): Collection<IConversationModel> {
    return this.chatDb.collection<IConversationModel>('conversations');
  }

  get conversationMembers(): Collection<IConversationMemberModel> {
    return this.chatDb.collection<IConversationMemberModel>('conversationMembers');
  }

  get chatMessages(): Collection<IChatMessageModel> {
    return this.chatDb.collection<IChatMessageModel>('messages');
  }
}
