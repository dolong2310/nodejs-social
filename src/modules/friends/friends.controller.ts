import { AutoBind } from '@/decorators';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseController } from '@/modules/base/base.controller';
import {
  AcceptDeclineRequestParamsDTO,
  RevokeOutgoingRequestParamsDTO,
  SendFriendRequestBodyDTO,
  UnfriendParamsDTO
} from '@/modules/friends/dtos/friends.request.dto';
import { FriendRequestRowResponseDTO, FriendUserSummaryResponseDTO } from '@/modules/friends/dtos/friends.response.dto';
import { FriendsService } from '@/modules/friends/friends.service';
import { Created } from '@/providers/httpResponses/success.response';
import { CursorPaginationQueryDTO } from '@/shared/dtos/common.request.dto';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IFriendsController {
  listFriends(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response): Promise<void>;
  listIncoming(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response): Promise<void>;
  listOutgoing(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response): Promise<void>;
  sendFriendRequest(req: Request<ParamsDictionary, object, SendFriendRequestBodyDTO>, res: Response): Promise<void>;
  acceptIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>, res: Response): Promise<void>;
  declineIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>, res: Response): Promise<void>;
  revokeOutgoingRequest(req: Request<RevokeOutgoingRequestParamsDTO>, res: Response): Promise<void>;
  unfriend(req: Request<UnfriendParamsDTO>, res: Response): Promise<void>;
}

@Injectable()
export class FriendsController extends BaseController implements IFriendsController {
  constructor(private readonly friendsService: FriendsService) {
    super();
  }

  @AutoBind()
  async listFriends(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { items, nextCursor } = await this.friendsService.listFriends(userId, Number(limit), cursor);
    this.sendCursorPaginatedResponse({
      res,
      items: items.map((u) => new FriendUserSummaryResponseDTO(u)),
      nextCursor,
      message: 'Get friends successfully'
    });
  }

  @AutoBind()
  async listIncoming(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { items, nextCursor } = await this.friendsService.listIncomingRequests(userId, Number(limit), cursor);
    this.sendCursorPaginatedResponse({
      res,
      items: items.map((u) => new FriendUserSummaryResponseDTO(u)),
      nextCursor,
      message: 'Get incoming friend requests successfully'
    });
  }

  @AutoBind()
  async listOutgoing(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { items, nextCursor } = await this.friendsService.listOutgoingRequests(userId, Number(limit), cursor);
    this.sendCursorPaginatedResponse({
      res,
      items: items.map((u) => new FriendUserSummaryResponseDTO(u)),
      nextCursor,
      message: 'Get outgoing friend requests successfully'
    });
  }

  @AutoBind()
  async sendFriendRequest(req: Request<ParamsDictionary, object, SendFriendRequestBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const dto = new SendFriendRequestBodyDTO(req.body);
    const created = await this.friendsService.sendFriendRequest(userId, dto.toUserId);
    this.sendResponse({
      res,
      instance: Created,
      data: new FriendRequestRowResponseDTO(created),
      message: 'Friend request sent successfully'
    });
  }

  @AutoBind()
  async acceptIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;
    await this.friendsService.acceptIncomingRequest(userId, fromUserId);
    this.sendResponse({ res, message: 'Friend request accepted successfully' });
  }

  @AutoBind()
  async declineIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;
    await this.friendsService.declineIncomingRequest(userId, fromUserId);
    this.sendResponse({ res, message: 'Friend request declined successfully' });
  }

  @AutoBind()
  async revokeOutgoingRequest(req: Request<RevokeOutgoingRequestParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { toUserId } = req.params;
    await this.friendsService.revokeOutgoingRequest(userId, toUserId);
    this.sendResponse({ res, message: 'Friend request revoked successfully' });
  }

  @AutoBind()
  async unfriend(req: Request<UnfriendParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { userId: otherUserId } = req.params;
    await this.friendsService.unfriend(userId, otherUserId);
    this.sendResponse({ res, message: 'Unfriend successfully' });
  }
}
