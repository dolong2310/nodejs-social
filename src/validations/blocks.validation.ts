import { IUsersValidation } from '@/validations/users.validation';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';

export interface IBlocksValidation {
  blockUserBodyValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  unblockUserIdValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

class BlocksValidation implements IBlocksValidation {
  blockUserBodyValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  unblockUserIdValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;

  constructor(private readonly usersValidation: IUsersValidation) {
    this.blockUserBodyValidation = this.usersValidation.userIdValidation('userId', 'body');
    this.unblockUserIdValidation = this.usersValidation.userIdValidation('userId', 'params');
  }
}

export default BlocksValidation;
