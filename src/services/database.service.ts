import { IFollower } from '@/models/schemas/follower.schema';
import { IRefreshToken } from '@/models/schemas/refreshToken.schema';
import { IUser } from '@/models/schemas/user.schema';
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

  get users(): Collection<IUser> {
    return this.db.collection<IUser>('users');
  }

  get refreshTokens(): Collection<IRefreshToken> {
    return this.db.collection<IRefreshToken>('refreshTokens');
  }

  get followers(): Collection<IFollower> {
    return this.db.collection<IFollower>('followers');
  }

  // get posts(): Collection<IPost> {
  //   return this.db.collection<IPost>('posts');
  // }
}

export default new DatabaseService();
