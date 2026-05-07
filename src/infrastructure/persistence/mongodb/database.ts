import logger from '@/infrastructure/logger/create-logger';
import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import { Db, MongoClient, type Collection, type Document } from 'mongodb';

const log = logger.child({ module: 'database-service' });

export interface MongoDatabasePort extends DatabasePort {
  dbClient: MongoClient;
  db: Db;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  initializeIndexes(): Promise<void>;
  initializeConversationIndexes(): Promise<void>;
}

export class MongoDatabase implements MongoDatabasePort {
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
      log.error({ err: error }, 'error connecting to mongodb');
      await this.disconnect();
      throw error;
    }
    log.info({ database: this.db.databaseName }, 'connected to mongodb');
  }

  async disconnect() {
    await this.dbClient.close();
  }

  // Create indexes once when the database is connected
  private get users(): Collection<Document> {
    return this.db.collection('users');
  }
  private get refreshTokens(): Collection<Document> {
    return this.db.collection('refresh_tokens');
  }
  private get otps(): Collection<Document> {
    return this.db.collection('otps');
  }
  private get videoStatuses(): Collection<Document> {
    return this.db.collection('video_status');
  }
  private get friendships(): Collection<Document> {
    return this.db.collection('friendships');
  }
  private get friendRequests(): Collection<Document> {
    return this.db.collection('friend_requests');
  }
  private get blocks(): Collection<Document> {
    return this.db.collection('blocks');
  }
  private get posts(): Collection<Document> {
    return this.db.collection('posts');
  }
  private get bookmarks(): Collection<Document> {
    return this.db.collection('bookmarks');
  }
  private get likes(): Collection<Document> {
    return this.db.collection('likes');
  }
  private get hashtags(): Collection<Document> {
    return this.db.collection('hashtags');
  }
  private get notifications(): Collection<Document> {
    return this.db.collection('notifications');
  }
  private get conversations(): Collection<Document> {
    return this.db.collection('conversations');
  }
  private get conversationMembers(): Collection<Document> {
    return this.db.collection('conversation_members');
  }
  private get chatMessages(): Collection<Document> {
    return this.db.collection('chat_messages');
  }

  private async indexExistsSafe(collection: Collection<Document>, indexNames: string[]): Promise<boolean> {
    try {
      return await collection.indexExists(indexNames);
    } catch (error: unknown) {
      const code = (error as { code?: number })?.code;
      if (code === 26) return false; // NamespaceNotFound (26) the collection has never been created
      throw error;
    }
  }

  private async findIndexSafe(collection: Collection<Document>, indexName: string): Promise<Document | null> {
    try {
      const indexes = await collection.listIndexes().toArray();
      return indexes.find((index) => index.name === indexName) ?? null;
    } catch (error: unknown) {
      const code = (error as { code?: number })?.code;
      if (code === 26) return null; // NamespaceNotFound (26) the collection has never been created
      throw error;
    }
  }

  private async createUsersIndex() {
    const isIndexExists = await this.indexExistsSafe(this.users, ['email_1_password_1', 'username_1', 'email_1']);
    if (isIndexExists) return;
    await Promise.all([
      this.users.createIndex({ email: 1, password: 1 }),
      this.users.createIndex({ username: 1 }, { unique: true }),
      this.users.createIndex({ email: 1 }, { unique: true })
    ]);
  }

  private async createRefreshTokensIndex() {
    const expiresAtIndex = await this.findIndexSafe(this.refreshTokens, 'expires_at_1');
    if (expiresAtIndex?.expireAfterSeconds !== undefined) {
      await this.refreshTokens.dropIndex('expires_at_1');
    }

    await Promise.all([
      this.refreshTokens.createIndex({ token: 1 }),
      this.refreshTokens.createIndex({ expires_at: 1 })
    ]);
  }

  private async createOtpsIndex() {
    const isIndexExists = await this.indexExistsSafe(this.otps, ['email_1_type_1', 'expires_at_1']);
    if (isIndexExists) return;
    await Promise.all([
      this.otps.createIndex({ email: 1, type: 1 }, { unique: true }),
      this.otps.createIndex({ expires_at: 1 })
    ]);
  }

  private async createVideoStatusesIndex() {
    const isIndexExists = await this.indexExistsSafe(this.videoStatuses, ['name_1']);
    if (isIndexExists) return;
    await this.videoStatuses.createIndex({ name: 1 });
  }

  private async createFriendshipIndexes() {
    const isIndexExists = await this.indexExistsSafe(this.friendships, ['user_id_low_1_user_id_high_1']);
    if (isIndexExists) return;
    await Promise.all([
      this.friendships.createIndex({ user_id_low: 1, user_id_high: 1 }, { unique: true }),
      this.friendships.createIndex({ user_id_low: 1 }),
      this.friendships.createIndex({ user_id_high: 1 })
    ]);
  }

  private async createFriendRequestIndexes() {
    const isIndexExists = await this.indexExistsSafe(this.friendRequests, ['from_user_id_1_to_user_id_1']);
    if (isIndexExists) return;
    await Promise.all([
      this.friendRequests.createIndex({ from_user_id: 1, to_user_id: 1 }, { unique: true }),
      this.friendRequests.createIndex({ to_user_id: 1, created_at: -1 }),
      this.friendRequests.createIndex({ from_user_id: 1, created_at: -1 }),
      this.friendRequests.createIndex({ from_user_id: 1, created_at: 1 })
    ]);
  }

  private async createBlockIndexes() {
    const isIndexExists = await this.indexExistsSafe(this.blocks, ['blocker_id_1_blocked_id_1']);
    if (isIndexExists) return;
    await Promise.all([
      this.blocks.createIndex({ blocker_id: 1, blocked_id: 1 }, { unique: true }),
      this.blocks.createIndex({ blocker_id: 1 }),
      this.blocks.createIndex({ blocked_id: 1 })
    ]);
  }

  private async createPostsIndex() {
    const isIndexExists = await this.indexExistsSafe(this.posts, ['content_text']);
    if (isIndexExists) return;
    await this.posts.createIndex({ content: 'text' }, { default_language: 'none' });
  }

  private async createPostsAdditionalIndexes() {
    await Promise.all([
      // For findPostsType / countPostsType queries: { parentId, type }
      // Also used by the $lookup self-join in aggregation pipelines that counts child posts (comments/reposts/quotes)
      this.posts.createIndex({ parent_id: 1, type: 1 }, { sparse: true }),
      // For cursor-based findPostsType query: match { parentId, type } + sort/filter by createdAt, _id
      this.posts.createIndex({ parent_id: 1, type: 1, created_at: -1, _id: -1 }, { sparse: true }),
      // For new-feed queries: { userId: { $in: [...] }, $or: [audience conditions] }
      this.posts.createIndex({ user_id: 1, audience: 1 }),
      // For guest feed & audience-only filters: { audience }
      this.posts.createIndex({ audience: 1 }),
      // For guest cursor feeds: match audience + sort/filter by createdAt, _id
      this.posts.createIndex({ audience: 1, created_at: -1, _id: -1 })
    ]);
  }

  private async createBookmarksIndex() {
    await Promise.all([
      // For bookmark create (upsert) and delete: { userId, postId } — also prevents duplicate bookmarks
      this.bookmarks.createIndex({ user_id: 1, post_id: 1 }, { unique: true }),
      // For the $lookup in post aggregation pipelines that calculates bookmarkCount per post
      this.bookmarks.createIndex({ post_id: 1 })
    ]);
  }

  private async createLikesIndex() {
    await Promise.all([
      this.likes.createIndex({ user_id: 1, post_id: 1 }, { unique: true }),
      this.likes.createIndex({ post_id: 1 })
    ]);
  }

  private async createHashtagsIndex() {
    // For findAndUpsertHashtags upsert filter and find-by-name queries
    await this.hashtags.createIndex({ name: 1 }, { unique: true });
  }

  /** Search posts: filters on audience + media.type (video / image) combine often in $match. */
  private async createSearchPostsAudienceMediaIndex() {
    const name = 'audience_1_media.type_1';
    if (await this.indexExistsSafe(this.posts, [name])) return;
    await this.posts.createIndex({ audience: 1, 'media.type': 1 }, { name });
  }

  private async createUsersSearchIndex() {
    const isIndexExists = await this.indexExistsSafe(this.users, ['name_1_username_1_email_1']);
    if (isIndexExists) return;
    await this.users.createIndex({ name: 'text', username: 'text', email: 'text' }, { default_language: 'none' });
  }

  private async createNotificationIndexes() {
    const col = this.notifications;
    const listIdx = 'recipient_id_1_created_at_-1__id_-1';
    if (!(await this.indexExistsSafe(col, [listIdx]))) {
      await col.createIndex({ recipient_id: 1, created_at: -1, _id: -1 }, { name: listIdx });
    }
  }

  async initializeIndexes() {
    await Promise.all([
      this.createUsersIndex(),
      this.createUsersSearchIndex(),
      this.createRefreshTokensIndex(),
      this.createOtpsIndex(),
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

  async initializeConversationIndexes(): Promise<void> {
    await Promise.all([
      this._ensureConversationDocumentsIndexes(),
      this._ensureConversationMembersIndexes(),
      this._ensureChatMessagesIndexes()
    ]);
  }

  private async _ensureConversationDocumentsIndexes(): Promise<void> {
    const col = this.conversations;
    const directPair = 'user_id_low_1_user_id_high_1';
    if (!(await this.indexExistsSafe(col, [directPair]))) {
      await col.createIndex(
        { user_id_low: 1, user_id_high: 1 },
        { unique: true, partialFilterExpression: { type: 'direct' } }
      );
    }
    const updated = 'updated_at_-1';
    if (!(await this.indexExistsSafe(col, [updated]))) {
      await col.createIndex({ updated_at: -1 });
    }
  }

  private async _ensureConversationMembersIndexes(): Promise<void> {
    const col = this.conversationMembers;
    const uniq = 'conversation_id_1_user_id_1';
    if (!(await this.indexExistsSafe(col, [uniq]))) {
      await col.createIndex({ conversation_id: 1, user_id: 1 }, { unique: true });
    }
    const byUser = 'user_id_1_conversation_id_1';
    if (!(await this.indexExistsSafe(col, [byUser]))) {
      await col.createIndex({ user_id: 1, conversation_id: 1 });
    }

    const byChatRole = 'conversation_id_1_role_1';
    if (!(await this.indexExistsSafe(col, [byChatRole]))) {
      await col.createIndex({ conversation_id: 1, role: 1 });
    }
  }

  private async _ensureChatMessagesIndexes(): Promise<void> {
    const col = this.chatMessages;
    const history = 'conversation_id_1_created_at_-1__id_-1';
    if (!(await this.indexExistsSafe(col, [history]))) {
      await col.createIndex({ conversation_id: 1, created_at: -1, _id: -1 }, { name: history });
    }
  }
}
