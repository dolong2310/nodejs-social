import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { IUsersValidation } from '@/presentation/http/validators/users.validator';

import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';

export interface IBlocksValidation {
  blockUserBodyValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  unblockUserIdValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

export class BlocksValidation implements IBlocksValidation {
  constructor(private readonly usersValidation: IUsersValidation) {}

  @AutoBind()
  blockUserBodyValidation() {
    return this.usersValidation.userIdValidation('userId', 'body');
  }

  @AutoBind()
  unblockUserIdValidation() {
    return this.usersValidation.userIdValidation('userId', 'params');
  }
}
