import { RequestHandlerType } from '@/presentation/http/express/middlewares/types';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export interface IFriendValidator {
  sendRequestToUserIdValidator: RequestHandlerType;
  incomingFromUserIdValidator: RequestHandlerType;
  revokeOutgoingToUserIdValidator: RequestHandlerType;
  unfriendUserIdValidator: RequestHandlerType;
}

export class FriendsValidator implements IFriendValidator {
  readonly sendRequestToUserIdValidator: RequestHandlerType;
  readonly incomingFromUserIdValidator: RequestHandlerType;
  readonly revokeOutgoingToUserIdValidator: RequestHandlerType;
  readonly unfriendUserIdValidator: RequestHandlerType;

  constructor(private readonly userValidator: IUserValidator) {
    this.sendRequestToUserIdValidator = this.userValidator.userIdValidator('toUserId', 'body');
    this.incomingFromUserIdValidator = this.userValidator.userIdValidator('fromUserId', 'params');
    this.revokeOutgoingToUserIdValidator = this.userValidator.userIdValidator('toUserId', 'params');
    this.unfriendUserIdValidator = this.userValidator.userIdValidator('userId', 'params');
  }
}
