import { IUpdateMeRequestBody } from '@/models/requests/user.request';
import { IUserResponse } from '@/models/responses/user.response';
import { IUser } from '@/models/schemas/user.schema';
import { IUserRepository } from '@/repositories/user.repository';
import { BaseService } from '@/services/base.service';

export interface IUsersService {
  findUserByEmail(email: string): Promise<IUser | null>;
  findUserById(userId: string): Promise<IUser | null>;
  findUserByUsername(username: string): Promise<IUser | null>;
  getMe(userId: string): Promise<IUserResponse | null>;
  updateMe(userId: string, body: IUpdateMeRequestBody & { dateOfBirth?: Date }): Promise<IUserResponse | null>;
  getUserProfile(username: string): Promise<IUserResponse | null>;
}

class UsersService extends BaseService implements IUsersService {
  constructor(private readonly userRepository: IUserRepository) {
    super();
  }

  findUserByEmail(email: string): Promise<IUser | null> {
    return this.userRepository.findByEmail(email);
  }

  findUserById(userId: string): Promise<IUser | null> {
    return this.userRepository.findById(userId);
  }

  findUserByUsername(username: string): Promise<IUser | null> {
    return this.userRepository.findByUsername(username);
  }

  getMe(userId: string): Promise<IUserResponse | null> {
    return this.userRepository.findById<IUserResponse>(userId, {
      projection: {
        password: 0,
        emailVerificationToken: 0,
        forgotPasswordToken: 0
      }
    });
  }

  updateMe(userId: string, body: IUpdateMeRequestBody & { dateOfBirth?: Date }): Promise<IUserResponse | null> {
    return this.userRepository.findOneAndUpdate<IUserResponse>(userId, body, {
      returnDocument: 'after',
      projection: {
        password: 0,
        emailVerificationToken: 0,
        forgotPasswordToken: 0
      }
    });
  }

  getUserProfile(username: string): Promise<IUserResponse | null> {
    return this.userRepository.findByUsername<IUserResponse>(username, {
      projection: {
        password: 0,
        emailVerificationToken: 0,
        forgotPasswordToken: 0
      }
    });
  }
}

export default UsersService;
