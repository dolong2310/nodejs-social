import { ObjectId } from 'mongodb';

export interface IHashtag {
  _id: ObjectId;
  name: string;
  createdAt?: Date;
}

class HashtagSchema {
  public _id: ObjectId;
  public name: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor({ _id, name, createdAt }: Omit<IHashtag, '_id'> & { _id?: ObjectId }) {
    const date = new Date();

    this._id = _id ?? new ObjectId();
    this.name = name;
    this.createdAt = createdAt ?? date;
  }
}

export default HashtagSchema;

// validate hashtag schema
// {
//   $jsonSchema: {
//     title: "Hashtag object validation",
//     bsonType: "object",
//     required: ["_id", "name", "createdAt"],
//     properties: {
//       _id: {
//         bsonType: "objectId",
//         description: "'_id' must be an objectId and is required",
//       },
//       name: {
//         bsonType: "string",
//         description: "'name' must be a string and is required",
//       },
//       createdAt: {
//         bsonType: "date",
//         description: "'createdAt' must be a date and is required",
//       },
//     },
//     additionalProperties: false
//   }
// }
