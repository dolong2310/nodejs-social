import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { IUserValidator } from '@/presentation/http/validators/user.validator';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';

export interface IBlockValidator {
  blockUserBodyValidator: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  unblockUserIdValidator: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

export class BlocksValidator implements IBlockValidator {
  constructor(private readonly userValidator: IUserValidator) {}

  @AutoBind()
  blockUserBodyValidator() {
    return this.userValidator.userIdValidator('userId', 'body');
  }

  @AutoBind()
  unblockUserIdValidator() {
    return this.userValidator.userIdValidator('userId', 'params');
  }
}
