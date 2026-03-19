import { EUserVerificationStatus } from '@/enums/users.enum';

export interface IUserResponse {
  _id: string;
  name: string;
  email: string;
  dateOfBirth: Date;
  verificationStatus?: EUserVerificationStatus;

  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;

  createdAt?: Date;
  updatedAt?: Date;
}
