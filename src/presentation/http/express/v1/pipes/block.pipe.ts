import { RequestHandlerType } from '@/presentation/http/express/types';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export interface IBlockPipe {
  blockUserBodyPipe: RequestHandlerType;
  unblockUserIdPipe: RequestHandlerType;
}

export class BlocksPipe implements IBlockPipe {
  readonly blockUserBodyPipe: RequestHandlerType;
  readonly unblockUserIdPipe: RequestHandlerType;

  constructor(private readonly userPipe: IUserPipe) {
    this.blockUserBodyPipe = this.userPipe.userIdPipe('userId', 'body');
    this.unblockUserIdPipe = this.userPipe.userIdPipe('userId', 'params');
  }
}
