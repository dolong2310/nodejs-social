import { ObjectId } from 'mongodb';

export interface IRefreshToken {
  _id?: ObjectId;
  token: string;
  userId: ObjectId;
  createdAt?: Date;
}

class RefreshTokenSchema {
  public _id?: ObjectId;
  public token: string;
  public userId: ObjectId;
  public createdAt?: Date;

  constructor({ _id, token, userId, createdAt }: IRefreshToken) {
    this._id = _id ?? new ObjectId();
    this.token = token;
    this.userId = userId;
    this.createdAt = createdAt ?? new Date();
  }
}

export default RefreshTokenSchema;

// validate refresh token schema
// {
//   $jsonSchema: {
//     title: "RefreshToken object validation",
//     bsonType: "object",
//     required: ["_id", "token", "userId", "createdAt"],
//     properties: {
//       _id: {
//         bsonType: "objectId",
//         description: "'_id' must be an objectId and is required",
//       },
//       token: {
//         bsonType: "string",
//         description: "'token' must be a string and is required",
//       },
//       userId: {
//         bsonType: "objectId",
//         description: "'userId' must be an objectId and is required",
//       },
//       createdAt: {
//         bsonType: "date",
//         description: "'createdAt' must be a date and is required",
//       },
//     },
//     additionalProperties: false
//   }
// }
