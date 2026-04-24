import logger from '@/infrastructure/logger/create-logger';
import { Db, MongoClient } from 'mongodb';

const log = logger.child({ module: 'database-service' });

export interface DatabasePort {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export class Database implements DatabasePort {
  public dbClient: MongoClient;
  public db: Db;

  constructor(readonly config: { uri: string; databaseName: string }) {
    this.dbClient = new MongoClient(config.uri);
    this.db = this.dbClient.db(config.databaseName);
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 });
    } catch (error) {
      log.error({ err: error }, 'error connecting to mongodb database');
      await this.disconnect();
      throw error;
    }
    log.info({ database: this.db.databaseName }, 'connected to mongodb databases');
  }

  async disconnect() {
    await this.dbClient.close();
  }

  // private async indexExistsSafe<T extends Document>(collection: Collection<T>, indexNames: string[]): Promise<boolean> {
  //   try {
  //     return await collection.indexExists(indexNames);
  //   } catch (error: unknown) {
  //     const code = (error as { code?: number })?.code;
  //     if (code === 26) return false; // NamespaceNotFound (26) the collection has never been created
  //     throw error;
  //   }
  // }

  // async createUsersIndex() {
  //   const isIndexExists = await this.indexExistsSafe(this.users, ['email_1_password_1', 'username_1', 'email_1']);
  //   if (isIndexExists) return;
  //   await Promise.all([
  //     this.users.createIndex({ email: 1, password: 1 }),
  //     this.users.createIndex({ username: 1 }, { unique: true }),
  //     this.users.createIndex({ email: 1 }, { unique: true })
  //   ]);
  // }

  // async createRefreshTokensIndex() {
  //   const isIndexExists = await this.indexExistsSafe(this.refreshTokens, ['token_1', 'exp_1']);
  //   if (isIndexExists) return;
  //   await Promise.all([
  //     this.refreshTokens.createIndex({ token: 1 }),
  //     this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 }) // mongodb will automatically delete the document after the expiration time because mongodb has background job to delete the document after the expiration time
  //   ]);
  // }

  // async createVideoStatusesIndex() {
  //   const isIndexExists = await this.indexExistsSafe(this.videoStatuses, ['name_1']);
  //   if (isIndexExists) return;
  //   await this.videoStatuses.createIndex({ name: 1 });
  // }

  // async createFriendshipIndexes() {
  //   const isIndexExists = await this.indexExistsSafe(this.friendships, ['userIdLow_1_userIdHigh_1']);
  //   if (isIndexExists) return;
  //   await Promise.all([
  //     this.friendships.createIndex({ userIdLow: 1, userIdHigh: 1 }, { unique: true }),
  //     this.friendships.createIndex({ userIdLow: 1 }),
  //     this.friendships.createIndex({ userIdHigh: 1 })
  //   ]);
  // }

  // async createFriendRequestIndexes() {
  //   const isIndexExists = await this.indexExistsSafe(this.friendRequests, ['fromUserId_1_toUserId_1']);
  //   if (isIndexExists) return;
  //   await Promise.all([
  //     this.friendRequests.createIndex({ fromUserId: 1, toUserId: 1 }, { unique: true }),
  //     this.friendRequests.createIndex({ toUserId: 1, createdAt: -1 }),
  //     this.friendRequests.createIndex({ fromUserId: 1, createdAt: -1 }),
  //     // UTC-day cap counts (D-07): range on createdAt for fixed fromUserId
  //     this.friendRequests.createIndex({ fromUserId: 1, createdAt: 1 })
  //   ]);
  // }

  // async createBlockIndexes() {
  //   const isIndexExists = await this.indexExistsSafe(this.blocks, ['blockerId_1_blockedId_1']);
  //   if (isIndexExists) return;
  //   await Promise.all([
  //     this.blocks.createIndex({ blockerId: 1, blockedId: 1 }, { unique: true }),
  //     this.blocks.createIndex({ blockerId: 1 }),
  //     this.blocks.createIndex({ blockedId: 1 })
  //   ]);
  // }

  // async createPostsIndex() {
  //   const isIndexExists = await this.indexExistsSafe(this.posts, ['content_text']);
  //   if (isIndexExists) return;
  //   await this.posts.createIndex({ content: 'text' }, { default_language: 'none' });
  // }

  // async createPostsAdditionalIndexes() {
  //   await Promise.all([
  //     // For findPostsType / countPostsType queries: { parentId, type }
  //     // Also used by the $lookup self-join in aggregation pipelines that counts child posts (comments/reposts/quotes)
  //     this.posts.createIndex({ parentId: 1, type: 1 }, { sparse: true }),
  //     // For cursor-based findPostsType query: match { parentId, type } + sort/filter by createdAt, _id
  //     this.posts.createIndex({ parentId: 1, type: 1, createdAt: -1, _id: -1 }, { sparse: true }),
  //     // For new-feed queries: { userId: { $in: [...] }, $or: [audience conditions] }
  //     this.posts.createIndex({ userId: 1, audience: 1 }),
  //     // For guest feed & audience-only filters: { audience }
  //     this.posts.createIndex({ audience: 1 }),
  //     // For guest cursor feeds: match audience + sort/filter by createdAt, _id
  //     this.posts.createIndex({ audience: 1, createdAt: -1, _id: -1 })
  //   ]);
  // }

  // async createBookmarksIndex() {
  //   await Promise.all([
  //     // For bookmark create (upsert) and delete: { userId, postId } — also prevents duplicate bookmarks
  //     this.bookmarks.createIndex({ userId: 1, postId: 1 }, { unique: true }),
  //     // For the $lookup in post aggregation pipelines that calculates bookmarkCount per post
  //     this.bookmarks.createIndex({ postId: 1 })
  //   ]);
  // }

  // async createLikesIndex() {
  //   await Promise.all([
  //     this.likes.createIndex({ userId: 1, postId: 1 }, { unique: true }),
  //     this.likes.createIndex({ postId: 1 })
  //   ]);
  // }

  // async createHashtagsIndex() {
  //   // For findAndUpsertHashtags upsert filter and find-by-name queries
  //   await this.hashtags.createIndex({ name: 1 }, { unique: true });
  // }

  // /** Search posts: filters on audience + media.type (video / image) combine often in $match. */
  // async createSearchPostsAudienceMediaIndex() {
  //   const name = 'audience_1_media.type_1';
  //   if (await this.indexExistsSafe(this.posts, [name])) return;
  //   await this.posts.createIndex({ audience: 1, 'media.type': 1 }, { name });
  // }

  // async createUsersSearchIndex() {
  //   const isIndexExists = await this.indexExistsSafe(this.users, ['name_1_username_1_email_1']);
  //   if (isIndexExists) return;
  //   await this.users.createIndex({ name: 'text', username: 'text', email: 'text' }, { default_language: 'none' });
  // }

  // async initializeIndexes() {
  //   await Promise.all([
  //     this.createUsersIndex(),
  //     this.createUsersSearchIndex(),
  //     this.createRefreshTokensIndex(),
  //     this.createVideoStatusesIndex(),
  //     this.createFriendshipIndexes(),
  //     this.createFriendRequestIndexes(),
  //     this.createBlockIndexes(),
  //     this.createPostsIndex(),
  //     this.createPostsAdditionalIndexes(),
  //     this.createSearchPostsAudienceMediaIndex(),
  //     this.createBookmarksIndex(),
  //     this.createLikesIndex(),
  //     this.createHashtagsIndex(),
  //     this.createNotificationIndexes()
  //   ]);
  // }

  // async createNotificationIndexes() {
  //   const col = this.notifications;
  //   const listIdx = 'recipientId_1_createdAt_-1__id_-1';
  //   if (!(await this.indexExistsSafe(col, [listIdx]))) {
  //     await col.createIndex({ recipientId: 1, createdAt: -1, _id: -1 }, { name: listIdx });
  //   }
  // }

  // /** Chat DB — idempotent indexes (Phase 4). Collection names unchanged: conversations, conversationMembers, messages. */
  // async initializeConversationIndexes(): Promise<void> {
  //   await Promise.all([
  //     this._ensureConversationDocumentsIndexes(),
  //     this._ensureConversationMembersIndexes(),
  //     this._ensureChatMessagesIndexes()
  //   ]);
  // }

  // private async _ensureConversationDocumentsIndexes(): Promise<void> {
  //   const col = this.conversations;
  //   const directPair = 'userIdLow_1_userIdHigh_1';
  //   if (!(await this.indexExistsSafe(col, [directPair]))) {
  //     await col.createIndex(
  //       { userIdLow: 1, userIdHigh: 1 },
  //       { unique: true, partialFilterExpression: { type: 'direct' } }
  //     );
  //   }
  //   const updated = 'updatedAt_-1';
  //   if (!(await this.indexExistsSafe(col, [updated]))) {
  //     await col.createIndex({ updatedAt: -1 });
  //   }
  // }

  // private async _ensureConversationMembersIndexes(): Promise<void> {
  //   const col = this.conversationMembers;
  //   const uniq = 'conversationId_1_userId_1';
  //   if (!(await this.indexExistsSafe(col, [uniq]))) {
  //     await col.createIndex({ conversationId: 1, userId: 1 }, { unique: true });
  //   }
  //   const byUser = 'userId_1_conversationId_1';
  //   if (!(await this.indexExistsSafe(col, [byUser]))) {
  //     await col.createIndex({ userId: 1, conversationId: 1 });
  //   }

  //   const byChatRole = 'conversationId_1_role_1';
  //   if (!(await this.indexExistsSafe(col, [byChatRole]))) {
  //     await col.createIndex({ conversationId: 1, role: 1 });
  //   }
  // }

  // private async _ensureChatMessagesIndexes(): Promise<void> {
  //   const col = this.chatMessages;
  //   const history = 'conversationId_1_createdAt_-1__id_-1';
  //   if (!(await this.indexExistsSafe(col, [history]))) {
  //     await col.createIndex({ conversationId: 1, createdAt: -1, _id: -1 }, { name: history });
  //   }
  // }
}
