import { BaseController } from '@/controllers/base.controller';
import { PaginationQueryDTO } from '@/dtos/requests/common.request.dto';
import {
  AcceptDeclineRequestParamsDTO,
  RevokeOutgoingRequestParamsDTO,
  SendFriendRequestBodyDTO,
  UnfriendParamsDTO
} from '@/dtos/requests/friends.request.dto';
import { FriendRequestRowResponseDTO, FriendUserSummaryResponseDTO } from '@/dtos/responses/friends.response.dto';
import { Created } from '@/responses/success.response';
import { IFriendsService } from '@/services/friends.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IFriendsController {
  listFriends(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response): Promise<void>;
  listIncoming(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response): Promise<void>;
  listOutgoing(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response): Promise<void>;
  sendFriendRequest(req: Request<ParamsDictionary, object, SendFriendRequestBodyDTO>, res: Response): Promise<void>;
  acceptIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>, res: Response): Promise<void>;
  declineIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>, res: Response): Promise<void>;
  revokeOutgoingRequest(req: Request<RevokeOutgoingRequestParamsDTO>, res: Response): Promise<void>;
  unfriend(req: Request<UnfriendParamsDTO>, res: Response): Promise<void>;
}

class FriendsController extends BaseController implements IFriendsController {
  constructor(private readonly friendsService: IFriendsService) {
    super();
  }

  listFriends = async (req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { page, limit } = req.query;
    const { users, total } = await this.friendsService.listFriends(userId, page, limit);
    this.sendPaginatedResponse<FriendUserSummaryResponseDTO[]>({
      res,
      data: users.map((u) => new FriendUserSummaryResponseDTO(u)),
      pagination: { page, limit, totalItems: total },
      message: 'Get friends successfully'
    });
  };

  listIncoming = async (req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { page, limit } = req.query;
    const { users, total } = await this.friendsService.listIncomingRequests(userId, page, limit);
    this.sendPaginatedResponse<FriendUserSummaryResponseDTO[]>({
      res,
      data: users.map((u) => new FriendUserSummaryResponseDTO(u)),
      pagination: { page, limit, totalItems: total },
      message: 'Get incoming friend requests successfully'
    });
  };

  listOutgoing = async (req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { page, limit } = req.query;
    const { users, total } = await this.friendsService.listOutgoingRequests(userId, page, limit);
    this.sendPaginatedResponse<FriendUserSummaryResponseDTO[]>({
      res,
      data: users.map((u) => new FriendUserSummaryResponseDTO(u)),
      pagination: { page, limit, totalItems: total },
      message: 'Get outgoing friend requests successfully'
    });
  };

  sendFriendRequest = async (req: Request<ParamsDictionary, object, SendFriendRequestBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const dto = new SendFriendRequestBodyDTO(req.body);
    const created = await this.friendsService.sendFriendRequest(userId, dto.toUserId);
    this.sendResponse({
      res,
      instance: Created,
      data: new FriendRequestRowResponseDTO(created),
      message: 'Friend request sent successfully'
    });
  };

  acceptIncomingRequest = async (req: Request<AcceptDeclineRequestParamsDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;
    await this.friendsService.acceptIncomingRequest(userId, fromUserId);
    this.sendResponse({ res, message: 'Friend request accepted successfully' });
  };

  declineIncomingRequest = async (req: Request<AcceptDeclineRequestParamsDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;
    await this.friendsService.declineIncomingRequest(userId, fromUserId);
    this.sendResponse({ res, message: 'Friend request declined successfully' });
  };

  revokeOutgoingRequest = async (req: Request<RevokeOutgoingRequestParamsDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { toUserId } = req.params;
    await this.friendsService.revokeOutgoingRequest(userId, toUserId);
    this.sendResponse({ res, message: 'Friend request revoked successfully' });
  };

  unfriend = async (req: Request<UnfriendParamsDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { userId: otherUserId } = req.params;
    await this.friendsService.unfriend(userId, otherUserId);
    this.sendResponse({ res, message: 'Unfriend successfully' });
  };
}

export default FriendsController;
