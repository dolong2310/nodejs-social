import { EUserVerificationStatus } from '@/enums/users.enum';
import { IUser } from '@/models/user.schema';

export class UserResponseDTO {
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

  constructor(user: IUser) {
    this._id = user._id.toString();
    this.name = user.name;
    this.email = user.email;
    this.dateOfBirth = user.dateOfBirth;
    this.verificationStatus = user.verificationStatus;
    this.bio = user.bio;
    this.location = user.location;
    this.website = user.website;
    this.username = user.username;
    this.avatar = user.avatar;
    this.coverPhoto = user.coverPhoto;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
