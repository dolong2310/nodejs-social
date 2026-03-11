import { IFollower } from '@/models/schemas/follower.schema';
import { IHashtag } from '@/models/schemas/hashtag.schema';
import { IPost } from '@/models/schemas/post.schema';
import { IRefreshToken } from '@/models/schemas/refreshToken.schema';
import { IUser } from '@/models/schemas/user.schema';
import { IVideoStatus } from '@/models/schemas/videoStatus.schema';
import dotenv from 'dotenv';
import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config();

const uri = process.env.MONGODB_URI!;

class DatabaseService {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    });
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
    await Promise.all([this.videoStatuses.createIndex({ name: 1 })]);
  }

  async createFollowersIndex() {
    const isIndexExists = await this.followers.indexExists(['userId_1_followedUserId_1']);
    if (isIndexExists) return;
    await Promise.all([this.followers.createIndex({ userId: 1, followedUserId: 1 })]);
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
}

export default new DatabaseService();
