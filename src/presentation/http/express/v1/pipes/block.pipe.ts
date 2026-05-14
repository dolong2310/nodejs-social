import { ExpressRequestHandler } from '@/presentation/http/express/types';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export interface IBlockPipe {
  blockUserBodyPipe: ExpressRequestHandler;
  unblockUserIdPipe: ExpressRequestHandler;
}

export class BlocksPipe implements IBlockPipe {
  readonly blockUserBodyPipe: ExpressRequestHandler;
  readonly unblockUserIdPipe: ExpressRequestHandler;

  constructor(private readonly userPipe: IUserPipe) {
    this.blockUserBodyPipe = this.userPipe.userIdPipe('userId', 'body');
    this.unblockUserIdPipe = this.userPipe.userIdPipe('userId', 'params');
  }
}
