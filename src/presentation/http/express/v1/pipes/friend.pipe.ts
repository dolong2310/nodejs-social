import { ExpressRequestHandler } from '@/presentation/http/express/types';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export interface IFriendPipe {
  sendRequestToUserIdPipe: ExpressRequestHandler;
  incomingFromUserIdPipe: ExpressRequestHandler;
  revokeOutgoingToUserIdPipe: ExpressRequestHandler;
  unfriendUserIdPipe: ExpressRequestHandler;
}

export class FriendsPipe implements IFriendPipe {
  readonly sendRequestToUserIdPipe: ExpressRequestHandler;
  readonly incomingFromUserIdPipe: ExpressRequestHandler;
  readonly revokeOutgoingToUserIdPipe: ExpressRequestHandler;
  readonly unfriendUserIdPipe: ExpressRequestHandler;

  constructor(private readonly userPipe: IUserPipe) {
    this.sendRequestToUserIdPipe = this.userPipe.userIdPipe('toUserId', 'body');
    this.incomingFromUserIdPipe = this.userPipe.userIdPipe('fromUserId', 'params');
    this.revokeOutgoingToUserIdPipe = this.userPipe.userIdPipe('toUserId', 'params');
    this.unfriendUserIdPipe = this.userPipe.userIdPipe('userId', 'params');
  }
}
