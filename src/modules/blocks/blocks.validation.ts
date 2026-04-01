import { AutoBind } from '@/decorators/autoBind.decorator';
import { Injectable } from '@/decorators/injectable.decorator';
import { UsersValidation } from '@/modules/users/users.validation';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';

export interface IBlocksValidation {
  blockUserBodyValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  unblockUserIdValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

@Injectable()
export class BlocksValidation implements IBlocksValidation {
  constructor(private readonly usersValidation: UsersValidation) {}

  @AutoBind()
  blockUserBodyValidation() {
    return this.usersValidation.userIdValidation('userId', 'body');
  }

  @AutoBind()
  unblockUserIdValidation() {
    return this.usersValidation.userIdValidation('userId', 'params');
  }
}
