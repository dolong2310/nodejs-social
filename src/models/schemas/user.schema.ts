import { EUserVerificationStatus } from '@/enums/users.enum';
import { ObjectId } from 'mongodb';

export interface IUser {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  dateOfBirth: Date;

  verificationStatus?: EUserVerificationStatus;
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

  public verificationStatus: EUserVerificationStatus;
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

    this.verificationStatus = user.verificationStatus ?? EUserVerificationStatus.UNVERIFIED;
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

// validate user schema
// {
//   "$jsonSchema": {
//     "title": "User object validation",
//     "bsonType": "object",
//     "required": [
//       "_id",
//       "name",
//       "email",
//       "password",
//       "dateOfBirth",
//       "verificationStatus",
//       "emailVerificationToken",
//       "forgotPasswordToken",
//       "createdAt",
//       "updatedAt",
//       "bio",
//       "location",
//       "website",
//       "username",
//       "avatar",
//       "coverPhoto"
//     ],
//     "properties": {
//       "_id": {
//         "bsonType": "objectId",
//         "description": "'_id' must be an objectId and is required"
//       },
//       "name": {
//         "bsonType": "string",
//         "description": "'name' must be a string and is required"
//       },
//       "email": {
//         "bsonType": "string",
//         "description": "'email' must be a string and is required"
//       },
//       "password": {
//         "bsonType": "string",
//         "description": "'password' must be a string and is required"
//       },
//       "dateOfBirth": {
//         "bsonType": "date",
//         "description": "'dateOfBirth' must be a date and is required"
//       },
//       "verificationStatus": {
//         "bsonType": "string",
//         "enum": ["verified", "unverified", "banned"],
//         "description": "'verificationStatus' must be one of the following values: 'verified', 'unverified', 'banned'"
//       },
//       "emailVerificationToken": {
//         "bsonType": "string",
//         "description": "'emailVerificationToken' must be a string and is required"
//       },
//       "forgotPasswordToken": {
//         "bsonType": "string",
//         "description": "'forgotPasswordToken' must be a string and is required"
//       },
//       "createdAt": {
//         "bsonType": "date",
//         "description": "'createdAt' must be a date and is required"
//       },
//       "updatedAt": {
//         "bsonType": "date",
//         "description": "'updatedAt' must be a date and is required"
//       },
//       "bio": {
//         "bsonType": "string",
//         "description": "'bio' must be a string and is required"
//       },
//       "location": {
//         "bsonType": "string",
//         "description": "'location' must be a string and is required"
//       },
//       "website": {
//         "bsonType": "string",
//         "description": "'website' must be a string and is required"
//       },
//       "username": {
//         "bsonType": "string",
//         "description": "'username' must be a string and is required"
//       },
//       "avatar": {
//         "bsonType": "string",
//         "description": "'avatar' must be a string and is required"
//       },
//       "coverPhoto": {
//         "bsonType": "string",
//         "description": "'coverPhoto' must be a string and is required"
//       }
//     },
//     "additionalProperties": false
//   }
// }