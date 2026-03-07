import { UserVerificationStatus } from '@/enums/users.enum';
import { ObjectId } from 'mongodb';

export interface IUser {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  dateOfBirth: Date;

  verificationStatus?: UserVerificationStatus;
  emailVerificationToken?: string;
  forgotPasswordToken?: string;
  createdAt?: Date;
  updatedAt?: Date;

  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;
}

class UserSchema {
  public _id: ObjectId;
  public name: string;
  public email: string;
  public password: string;
  public dateOfBirth: Date;

  public verificationStatus: UserVerificationStatus;
  public emailVerificationToken: string;
  public forgotPasswordToken: string;
  public createdAt: Date;
  public updatedAt: Date;

  public bio?: string;
  public location?: string;
  public website?: string;
  public username?: string;
  public avatar?: string;
  public coverPhoto?: string;

  constructor(user: IUser) {
    const date = new Date();

    this._id = user._id ?? new ObjectId();

    this.name = user.name;
    this.email = user.email;
    this.password = user.password;
    this.dateOfBirth = user.dateOfBirth;

    this.verificationStatus = user.verificationStatus ?? UserVerificationStatus.UNVERIFIED;
    this.emailVerificationToken = user.emailVerificationToken ?? '';
    this.forgotPasswordToken = user.forgotPasswordToken ?? '';
    this.createdAt = user.createdAt ?? date;
    this.updatedAt = user.updatedAt ?? date;

    this.bio = user.bio ?? '';
    this.location = user.location ?? '';
    this.website = user.website ?? '';
    this.username = user.username ?? '';
    this.avatar = user.avatar ?? '';
    this.coverPhoto = user.coverPhoto ?? '';
  }
}

export default UserSchema;
