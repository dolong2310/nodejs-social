import { RequestHandlerType } from '@/presentation/http/express/middlewares/types';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export interface IBlockValidator {
  blockUserBodyValidator: RequestHandlerType;
  unblockUserIdValidator: RequestHandlerType;
}

export class BlocksValidator implements IBlockValidator {
  readonly blockUserBodyValidator: RequestHandlerType;
  readonly unblockUserIdValidator: RequestHandlerType;

  constructor(private readonly userValidator: IUserValidator) {
    this.blockUserBodyValidator = this.userValidator.userIdValidator('userId', 'body');
    this.unblockUserIdValidator = this.userValidator.userIdValidator('userId', 'params');
  }
}
