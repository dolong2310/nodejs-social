import { RequestHandlerType } from '@/presentation/http/express/types';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export interface IFriendPipe {
  sendRequestToUserIdPipe: RequestHandlerType;
  incomingFromUserIdPipe: RequestHandlerType;
  revokeOutgoingToUserIdPipe: RequestHandlerType;
  unfriendUserIdPipe: RequestHandlerType;
}

export class FriendsPipe implements IFriendPipe {
  readonly sendRequestToUserIdPipe: RequestHandlerType;
  readonly incomingFromUserIdPipe: RequestHandlerType;
  readonly revokeOutgoingToUserIdPipe: RequestHandlerType;
  readonly unfriendUserIdPipe: RequestHandlerType;

  constructor(private readonly userPipe: IUserPipe) {
    this.sendRequestToUserIdPipe = this.userPipe.userIdPipe('toUserId', 'body');
    this.incomingFromUserIdPipe = this.userPipe.userIdPipe('fromUserId', 'params');
    this.revokeOutgoingToUserIdPipe = this.userPipe.userIdPipe('toUserId', 'params');
    this.unfriendUserIdPipe = this.userPipe.userIdPipe('userId', 'params');
  }
}
