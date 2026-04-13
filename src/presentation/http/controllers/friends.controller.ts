import { IFriendsService } from '@/application/ports/friend.port';

import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { CursorPaginationQueryDTO } from '@/presentation/http/dtos/common/common.request.dto';
import {
  AcceptDeclineRequestParamsDTO,
  RevokeOutgoingRequestParamsDTO,
  SendFriendRequestBodyDTO,
  UnfriendParamsDTO
} from '@/presentation/http/dtos/friend/friends.request.dto';
import {
  FriendRequestRowResponseDTO,
  FriendUserSummaryResponseDTO
} from '@/presentation/http/dtos/friend/friends.response.dto';
import { Created } from '@/presentation/http/responses/success.response';

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

export class FriendsController extends BaseController implements IFriendsController {
  constructor(private readonly friendsService: IFriendsService) {
    super();
  }

  @AutoBind()
  async listFriends(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { items, nextCursor } = await this.friendsService.listFriends({
      myUserId: userId,
      limit: Number(limit),
      cursor
    });
    this.sendCursorPaginatedResponse({
      res,
      items: items.map((user) => new FriendUserSummaryResponseDTO(user)),
      nextCursor,
      message: 'Get friends successfully'
    });
  }

  @AutoBind()
  async listIncoming(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { items, nextCursor } = await this.friendsService.listIncomingRequests({
      myUserId: userId,
      limit: Number(limit),
      cursor
    });
    this.sendCursorPaginatedResponse({
      res,
      items: items.map((user) => new FriendUserSummaryResponseDTO(user)),
      nextCursor,
      message: 'Get incoming friend requests successfully'
    });
  }

  @AutoBind()
  async listOutgoing(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { items, nextCursor } = await this.friendsService.listOutgoingRequests({
      myUserId: userId,
      limit: Number(limit),
      cursor
    });
    this.sendCursorPaginatedResponse({
      res,
      items: items.map((user) => new FriendUserSummaryResponseDTO(user)),
      nextCursor,
      message: 'Get outgoing friend requests successfully'
    });
  }

  @AutoBind()
  async sendFriendRequest(req: Request<ParamsDictionary, object, SendFriendRequestBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const dto = new SendFriendRequestBodyDTO(req.body);
    const created = await this.friendsService.sendFriendRequest({ myUserId: userId, toUserId: dto.toUserId });
    this.sendResponse({
      res,
      instance: Created,
      data: new FriendRequestRowResponseDTO(created.friendRequest),
      message: 'Friend request sent successfully'
    });
  }

  @AutoBind()
  async acceptIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;
    await this.friendsService.acceptIncomingRequest({ myUserId: userId, fromUserId });
    this.sendResponse({ res, message: 'Friend request accepted successfully' });
  }

  @AutoBind()
  async declineIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;
    await this.friendsService.declineIncomingRequest({ myUserId: userId, fromUserId });
    this.sendResponse({ res, message: 'Friend request declined successfully' });
  }

  @AutoBind()
  async revokeOutgoingRequest(req: Request<RevokeOutgoingRequestParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { toUserId } = req.params;
    await this.friendsService.revokeOutgoingRequest({ myUserId: userId, toUserId });
    this.sendResponse({ res, message: 'Friend request revoked successfully' });
  }

  @AutoBind()
  async unfriend(req: Request<UnfriendParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { userId: otherUserId } = req.params;
    await this.friendsService.unfriend({ myUserId: userId, otherUserId });
    this.sendResponse({ res, message: 'Unfriend successfully' });
  }
}
