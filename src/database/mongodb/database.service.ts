import { logger } from '@/logger';
import { IBookmark } from '@/models/schemas/bookmark.schema';
import { IConversation } from '@/models/schemas/conversation.schema';
import { IFollower } from '@/models/schemas/follower.schema';
import { IHashtag } from '@/models/schemas/hashtag.schema';
import { IPost } from '@/models/schemas/post.schema';
import { IRefreshToken } from '@/models/schemas/refreshToken.schema';
import { IUser } from '@/models/schemas/user.schema';
import { IVideoStatus } from '@/models/schemas/videoStatus.schema';
import { Collection, Db, MongoClient } from 'mongodb';

const log = logger.child({ module: 'mongodb' });

export interface IDatabaseService {
  connect(): Promise<void>;
  close(): Promise<void>;
  createUsersIndex(): Promise<void>;
  createRefreshTokensIndex(): Promise<void>;
  createVideoStatusesIndex(): Promise<void>;
  createFollowersIndex(): Promise<void>;
  createPostsIndex(): Promise<void>;
}

class DatabaseService implements IDatabaseService {
  private client: MongoClient;
  private db: Db;
  private isClosed = false;

  constructor(config: { uri: string; databaseName: string }) {
    this.client = new MongoClient(config.uri);
    this.db = this.client.db(config.databaseName);
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 });
      log.info('connected to database');
    } catch (error) {
      log.error({ err: error }, 'error connecting to database');
      await this.close(); // Ensures that the client will close when you error
      throw error;
    }
  }

  async close() {
    if (this.isClosed) return;
    this.isClosed = true;
    await this.client.close();
  }

  async createUsersIndex() {
    const isIndexExists = await this.users.indexExists(['email_1_password_1', 'username_1', 'email_1']);
    if (isIndexExists) return;
    await Promise.all([
      this.users.createIndex({ email: 1, password: 1 }),
      this.users.createIndex({ username: 1 }, { unique: true }),
      this.users.createIndex({ email: 1 }, { unique: true })
    ]);
  }

  async createRefreshTokensIndex() {
    const isIndexExists = await this.refreshTokens.indexExists(['token_1', 'exp_1']);
    if (isIndexExists) return;
    await Promise.all([
      this.refreshTokens.createIndex({ token: 1 }),
      this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 }) // mongodb will automatically delete the document after the expiration time because mongodb has background job to delete the document after the expiration time
    ]);
  }

  async createVideoStatusesIndex() {
    const isIndexExists = await this.videoStatuses.indexExists(['name_1']);
    if (isIndexExists) return;
    await this.videoStatuses.createIndex({ name: 1 });
  }

  async createFollowersIndex() {
    const isIndexExists = await this.followers.indexExists(['userId_1_followedUserId_1']);
    if (isIndexExists) return;
    await this.followers.createIndex({ userId: 1, followedUserId: 1 });
  }

  async createPostsIndex() {
    const isIndexExists = await this.posts.indexExists(['content_text']);
    if (isIndexExists) return;
    await this.posts.createIndex({ content: 'text' }, { default_language: 'none' });
  }

  async createPostsAdditionalIndexes() {
    await Promise.all([
      // For findPostsType / countPostsType queries: { parentId, type }
      // Also used by the $lookup self-join in aggregation pipelines that counts child posts (comments/reposts/quotes)
      this.posts.createIndex({ parentId: 1, type: 1 }, { sparse: true }),
      // For new-feed queries: { userId: { $in: [...] }, $or: [audience conditions] }
      this.posts.createIndex({ userId: 1, audience: 1 }),
      // For guest feed & audience-only filters: { audience }
      this.posts.createIndex({ audience: 1 })
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

  async createConversationsIndex() {
    // For findConversations / countConversations which filter by senderId+receiverId in both directions
    await this.conversations.createIndex({ senderId: 1, receiverId: 1 });
  }

  async createHashtagsIndex() {
    // For findAndUpsertHashtags upsert filter and find-by-name queries
    await this.hashtags.createIndex({ name: 1 }, { unique: true });
  }

  /** Search posts: filters on audience + media.type (video / image) combine often in $match. */
  async createSearchPostsAudienceMediaIndex() {
    const name = 'audience_1_media.type_1';
    if (await this.posts.indexExists([name])) return;
    await this.posts.createIndex({ audience: 1, 'media.type': 1 }, { name });
  }

  async createUsersSearchIndex() {
    const isIndexExists = await this.users.indexExists(['name_1_username_1_email_1']);
    if (isIndexExists) return;
    await this.users.createIndex({ name: 'text', username: 'text', email: 'text' }, { default_language: 'none' });
  }

  async initializeIndexes() {
    await Promise.all([
      this.createUsersIndex(),
      this.createUsersSearchIndex(),
      this.createRefreshTokensIndex(),
      this.createVideoStatusesIndex(),
      this.createFollowersIndex(),
      this.createPostsIndex(),
      this.createPostsAdditionalIndexes(),
      this.createSearchPostsAudienceMediaIndex(),
      this.createBookmarksIndex(),
      this.createConversationsIndex(),
      this.createHashtagsIndex()
    ]);
  }

  get users(): Collection<IUser> {
    return this.db.collection<IUser>('users');
  }

  get refreshTokens(): Collection<IRefreshToken> {
    return this.db.collection<IRefreshToken>('refreshTokens');
  }

  get followers(): Collection<IFollower> {
    return this.db.collection<IFollower>('followers');
  }

  get videoStatuses(): Collection<IVideoStatus> {
    return this.db.collection<IVideoStatus>('videoStatuses');
  }

  get posts(): Collection<IPost> {
    return this.db.collection<IPost>('posts');
  }

  get hashtags(): Collection<IHashtag> {
    return this.db.collection<IHashtag>('hashtags');
  }

  get bookmarks(): Collection<IBookmark> {
    return this.db.collection<IBookmark>('bookmarks');
  }

  get conversations(): Collection<IConversation> {
    return this.db.collection<IConversation>('conversations');
  }
}

export default DatabaseService;
