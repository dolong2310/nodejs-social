import { PostAudience, PostType } from '@/enums/posts.enum';
import { IMedia } from '@/types/media.type';
import { ObjectId } from 'mongodb';

export interface IPost {
  _id?: ObjectId;
  userId: ObjectId;
  type: PostType;
  audience: PostAudience;
  content: string;
  parentId: ObjectId | null;
  hashtags: ObjectId[];
  mentions: ObjectId[];
  media: IMedia[];
  guestViews: number;
  userViews: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class PostSchema {
  public _id?: ObjectId;
  public userId: ObjectId;
  public type: PostType;
  public audience: PostAudience;
  public content: string;
  public parentId: ObjectId | null;
  public hashtags: ObjectId[];
  public mentions: ObjectId[];
  public media: IMedia[];
  public guestViews: number;
  public userViews: number;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor({
    _id,
    userId,
    type,
    audience,
    content,
    parentId,
    hashtags,
    mentions,
    media,
    guestViews,
    userViews,
    createdAt,
    updatedAt
  }: IPost) {
    const date = new Date();

    this._id = _id ?? new ObjectId();
    this.userId = userId;
    this.type = type;
    this.audience = audience;
    this.content = content;
    this.parentId = parentId;
    this.hashtags = hashtags;
    this.mentions = mentions;
    this.media = media;
    this.guestViews = guestViews ?? 0;
    this.userViews = userViews ?? 0;
    this.createdAt = createdAt ?? date;
    this.updatedAt = updatedAt ?? date;
  }
}

export default PostSchema;

// Schema validation for posts in mongodb compass
// {
//   "$jsonSchema": {
//     "title": "posts object validation",
//     "bsonType": "object",
//     "required": [
//       "_id",
//       "userId",
//       "type",
//       "audience",
//       "content",
//       "parentId",
//       "hashtags",
//       "mentions",
//       "media",
//       "guestViews",
//       "userViews",
//       "createdAt",
//       "updatedAt"
//     ],
//     "properties": {
//       "_id": {
//         "bsonType": "objectId",
//         "description": "'_id' must be an objectId and is required"
//       },
//       "userId": {
//         "bsonType": "objectId",
//         "description": "'userId' must be an objectId and is required"
//       },
//       "type": {
//         "bsonType": "string",
//         "enum": ["post", "repost", "comment", "quote"],
//         "description": "'type' must be one of the following values: 'post', 'repost', 'comment', 'quote'"
//       },
//       "audience": {
//         "bsonType": "string",
//         "enum": ["public", "followers", "only_me"],
//         "description": "'audience' must be one of the following values: 'public', 'followers', 'only_me'"
//       },
//       "content": {
//         "bsonType": "string",
//         "description": "'content' must be a string and is required"
//       },
//       "parentId": {
//         "bsonType": ["objectId", "null"],
//         "description": "'parentId' must be an objectId or null and is required"
//       },
//       "hashtags": {
//         "bsonType": "array",
//         "uniqueItems": true,
//         "items": {
//           "bsonType": "objectId"
//         },
//         "description": "'hashtags' must be an array of objectIds and is required"
//       },
//       "mentions": {
//         "bsonType": "array",
//         "uniqueItems": true,
//         "items": {
//           "bsonType": "objectId"
//         },
//         "description": "'mentions' must be an array of objectIds and is required"
//       },
//       "media": {
//         "bsonType": "array",
//         "uniqueItems": true,
//         "items": {
//           "bsonType": "object",
//           "required": ["url", "type"],
//           "properties": {
//             "url": {
//               "bsonType": "string",
//               "description": "'url' must be a valid URL",
//               "pattern": "^https?://.*"
//             },
//             "type": {
//               "bsonType": "string",
//               "enum": ["image", "video", "video-hls"],
//               "description": "'type' must be one of the following values: 'image', 'video', 'video-hls'"
//             }
//           }
//         },
//         "description": "'media' must be an array of valid media items and is required"
//       },
//       "guestViews": {
//         "bsonType": "int",
//         "minimum": 0,
//         "description": "'guestViews' must be an integer and is required"
//       },
//       "userViews": {
//         "bsonType": "int",
//         "minimum": 0,
//         "description": "'userViews' must be an integer and is required"
//       },
//       "createdAt": {
//         "bsonType": "date",
//         "description": "'createdAt' must be a date and is required"
//       },
//       "updatedAt": {
//         "bsonType": "date",
//         "description": "'updatedAt' must be a date and is required"
//       }
//     },
//     "additionalProperties": false
//   }
// }
