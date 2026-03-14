import { IBookmark } from '@/models/schemas/bookmark.schema';
import { IFollower } from '@/models/schemas/follower.schema';
import { IHashtag } from '@/models/schemas/hashtag.schema';
import { IPost } from '@/models/schemas/post.schema';
import { IRefreshToken } from '@/models/schemas/refreshToken.schema';
import { IUser } from '@/models/schemas/user.schema';
import { IVideoStatus } from '@/models/schemas/videoStatus.schema';
import dotenv from 'dotenv';
import { Collection, Db, MongoClient } from 'mongodb';

dotenv.config();

const uri = process.env.MONGODB_URI!;

class DatabaseService {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(process.env.DATABASE_NAME!);
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 });
      console.log('Successfully connected to database');
    } catch (error) {
      console.error('Error connecting to database:', error);
      await this.client.close(); // Ensures that the client will close when you error
      throw error;
    }
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

  async createUsersSearchIndex() {
    const isIndexExists = await this.users.indexExists(['name_1_username_1_email_1']);
    if (isIndexExists) return;
    await this.users.createIndex({ name: 'text', username: 'text', email: 'text' }, { default_language: 'none' });
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
}

export default new DatabaseService();
