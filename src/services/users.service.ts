import { IUpdateMeRequestBody } from '@/models/requests/user.request';
import { IUser } from '@/models/schemas/user.schema';
import { IUserRepository } from '@/repositories/user.repository';

export interface IUsersService {
  findUserByEmail(email: string): Promise<IUser | null>;
  findUserById(userId: string): Promise<IUser | null>;
  findUserByUsername(username: string): Promise<IUser | null>;
  getMe(userId: string): Promise<Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'> | null>;
  updateMe(userId: string, body: IUpdateMeRequestBody & { dateOfBirth?: Date }): Promise<IUser | null>;
  getUserProfile(
    username: string
  ): Promise<Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'> | null>;
}

class UsersService implements IUsersService {
  constructor(private readonly userRepository: IUserRepository) {}

  findUserByEmail(email: string): Promise<IUser | null> {
    return this.userRepository.findByEmail(email);
  }

  findUserById(userId: string): Promise<IUser | null> {
    return this.userRepository.findById(userId);
  }

  findUserByUsername(username: string): Promise<IUser | null> {
    return this.userRepository.findByUsername(username);
  }

  getMe(userId: string): Promise<Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'> | null> {
    return this.userRepository.findById(userId, {
      projection: {
        password: 0,
        emailVerificationToken: 0,
        forgotPasswordToken: 0
      }
    });
  }

  updateMe(userId: string, body: IUpdateMeRequestBody & { dateOfBirth?: Date }): Promise<IUser | null> {
    return this.userRepository.findOneAndUpdate(userId, body, {
      returnDocument: 'after',
      projection: {
        password: 0,
        emailVerificationToken: 0,
        forgotPasswordToken: 0
      }
    });
  }

  getUserProfile(
    username: string
  ): Promise<Omit<IUser, 'password' | 'emailVerificationToken' | 'forgotPasswordToken'> | null> {
    return this.userRepository.findByUsername(username, {
      projection: {
        password: 0,
        emailVerificationToken: 0,
        forgotPasswordToken: 0
      }
    });
  }
}

export default UsersService;
