import { IUpdateMeRequestBody } from '@/models/requests/user.request';
import { IUser } from '@/models/schemas/user.schema';
import databaseService from '@/services/database.service';
import { ObjectId, WithId } from 'mongodb';

class UsersService {
  constructor() {}

  findUserByEmail(email: string): Promise<IUser | null> {
    return databaseService.users.findOne<IUser>({ email });
  }

  findUserById(userId: string): Promise<IUser | null> {
    return databaseService.users.findOne<IUser>({ _id: new ObjectId(userId) });
  }

  findUserByUsername(username: string): Promise<IUser | null> {
    return databaseService.users.findOne<IUser>({ username });
  }

  getMe(
    userId: string
  ): Promise<WithId<Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'>> | null> {
    return databaseService.users.findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          password: 0,
          emailVerificationToken: 0,
          forgotPasswordToken: 0
        }
      }
    );
  }

  updateMe(userId: string, body: IUpdateMeRequestBody & { dateOfBirth?: Date }): Promise<IUser | null> {
    return databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      {
        $set: body,
        $currentDate: { updatedAt: true }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          emailVerificationToken: 0,
          forgotPasswordToken: 0
        }
      }
    );
  }

  getUserProfile(
    username: string
  ): Promise<WithId<Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'>> | null> {
    return databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          emailVerificationToken: 0,
          forgotPasswordToken: 0
        }
      }
    );
  }
}

export default new UsersService();
