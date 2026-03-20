import { ObjectId } from 'mongodb';

export const isValidMongoId = (id: string): boolean => {
  return ObjectId.isValid(id);
};
