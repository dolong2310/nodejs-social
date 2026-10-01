import type { ExpressRequestHandler } from '@/presentation/http/express/types';
import type { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export interface IFriendPipe {
  sendRequestToUsernamePipe: ExpressRequestHandler;
  incomingFromUserIdPipe: ExpressRequestHandler;
  revokeOutgoingToUserIdPipe: ExpressRequestHandler;
  unfriendUserIdPipe: ExpressRequestHandler;
}

export class FriendsPipe implements IFriendPipe {
  readonly sendRequestToUsernamePipe: ExpressRequestHandler;
  readonly incomingFromUserIdPipe: ExpressRequestHandler;
  readonly revokeOutgoingToUserIdPipe: ExpressRequestHandler;
  readonly unfriendUserIdPipe: ExpressRequestHandler;

  constructor(private readonly userPipe: IUserPipe) {
    this.sendRequestToUsernamePipe = this.userPipe.usernamePipe('username', 'body');
    this.incomingFromUserIdPipe = this.userPipe.userIdPipe('fromUserId', 'params');
    this.revokeOutgoingToUserIdPipe = this.userPipe.userIdPipe('toUserId', 'params');
    this.unfriendUserIdPipe = this.userPipe.userIdPipe('userId', 'params');
  }
}
