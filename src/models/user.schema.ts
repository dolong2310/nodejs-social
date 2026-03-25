import { EUserVerificationStatus } from '@/enums/users.enum';
import { ObjectId } from 'mongodb';

export interface IUser {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  dateOfBirth: Date;
  verificationStatus?: EUserVerificationStatus;

  emailVerificationToken?: string;
  forgotPasswordToken?: string;

  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

class UserSchema {
  public _id: ObjectId;
  public name: string;
  public email: string;
  public password: string;
  public dateOfBirth: Date;
  public verificationStatus: EUserVerificationStatus;

  public emailVerificationToken: string;
  public forgotPasswordToken: string;

  public bio?: string;
  public location?: string;
  public website?: string;
  public username?: string;
  public avatar?: string;
  public coverPhoto?: string;

  public createdAt: Date;
  public updatedAt: Date;

  constructor(user: Omit<IUser, '_id'> & { _id?: ObjectId }) {
    const date = new Date();

    this._id = user._id ?? new ObjectId();

    this.name = user.name;
    this.email = user.email;
    this.password = user.password;
    this.dateOfBirth = user.dateOfBirth;
    this.verificationStatus = user.verificationStatus ?? EUserVerificationStatus.UNVERIFIED;

    this.emailVerificationToken = user.emailVerificationToken ?? '';
    this.forgotPasswordToken = user.forgotPasswordToken ?? '';

    this.bio = user.bio ?? '';
    this.location = user.location ?? '';
    this.website = user.website ?? '';
    this.username = user.username ?? '';
    this.avatar = user.avatar ?? '';
    this.coverPhoto = user.coverPhoto ?? '';

    this.createdAt = user.createdAt ?? date;
    this.updatedAt = user.updatedAt ?? date;
  }
}

export default UserSchema;
