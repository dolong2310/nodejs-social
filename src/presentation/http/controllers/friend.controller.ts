import { AcceptIncomingRequestInPort } from '@/application/use-cases/friend/accept-incoming-request/accept-incoming-request.in-port';
import { DeclineIncomingRequestInPort } from '@/application/use-cases/friend/decline-incoming-request/decline-incoming-request.in-port';
import { GetFriendsInPort } from '@/application/use-cases/friend/get-friends/get-friends.in-port';
import { GetIncomingRequestsInPort } from '@/application/use-cases/friend/get-incoming-requests/get-incoming-requests.in-port';
import { GetOutgoingRequestsInPort } from '@/application/use-cases/friend/get-outgoing-requests/get-outgoing-requests.in-port';
import { RevokeOutgoingRequestInPort } from '@/application/use-cases/friend/revoke-outgoing-request/revoke-outgoing-request.in-port';
import { SendFriendRequestInPort } from '@/application/use-cases/friend/send-friend-request/send-friend-request.in-port';
import { UnfriendInPort } from '@/application/use-cases/friend/unfriend/unfriend.in-port';
import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { CursorPaginationQueryDTO } from '@/presentation/http/dtos/common/common.request.dto';
import {
  AcceptDeclineRequestParamsDTO,
  RevokeOutgoingRequestParamsDTO,
  SendFriendRequestBodyDTO,
  UnfriendParamsDTO
} from '@/presentation/http/dtos/friend/friend.request.dto';
import { FriendRequestResponseDTO, FriendUserResponseDTO } from '@/presentation/http/dtos/friend/friend.response.dto';
import { Created } from '@/presentation/http/responses/success.response';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IFriendController {
  listFriends(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response): Promise<void>;
  listIncoming(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response): Promise<void>;
  listOutgoing(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response): Promise<void>;
  sendFriendRequest(req: Request<ParamsDictionary, object, SendFriendRequestBodyDTO>, res: Response): Promise<void>;
  acceptIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>, res: Response): Promise<void>;
  declineIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>, res: Response): Promise<void>;
  revokeOutgoingRequest(req: Request<RevokeOutgoingRequestParamsDTO>, res: Response): Promise<void>;
  unfriend(req: Request<UnfriendParamsDTO>, res: Response): Promise<void>;
}

export class FriendController extends BaseController implements IFriendController {
  constructor(
    private readonly listFriendsUC: GetFriendsInPort,
    private readonly listIncomingRequestsUC: GetIncomingRequestsInPort,
    private readonly listOutgoingRequestsUC: GetOutgoingRequestsInPort,
    private readonly sendFriendRequestUC: SendFriendRequestInPort,
    private readonly acceptIncomingRequestUC: AcceptIncomingRequestInPort,
    private readonly declineIncomingRequestUC: DeclineIncomingRequestInPort,
    private readonly revokeOutgoingRequestUC: RevokeOutgoingRequestInPort,
    private readonly unfriendUC: UnfriendInPort
  ) {
    super();
  }

  @AutoBind()
  async listFriends(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;

    const { items, nextCursor } = await this.listFriendsUC.execute({
      userId,
      limit: Number(limit),
      cursor
    });

    this.sendCursorPaginatedResponse<FriendUserResponseDTO>({
      res,
      items,
      nextCursor,
      message: 'Get friends successfully'
    });
  }

  @AutoBind()
  async listIncoming(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;

    const { items, nextCursor } = await this.listIncomingRequestsUC.execute({
      userId,
      limit: Number(limit),
      cursor
    });

    this.sendCursorPaginatedResponse<FriendUserResponseDTO>({
      res,
      items,
      nextCursor,
      message: 'Get incoming friend requests successfully'
    });
  }

  @AutoBind()
  async listOutgoing(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;

    const { items, nextCursor } = await this.listOutgoingRequestsUC.execute({
      userId,
      limit: Number(limit),
      cursor
    });

    this.sendCursorPaginatedResponse<FriendUserResponseDTO>({
      res,
      items,
      nextCursor,
      message: 'Get outgoing friend requests successfully'
    });
  }

  @AutoBind()
  async sendFriendRequest(req: Request<ParamsDictionary, object, SendFriendRequestBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const dto = new SendFriendRequestBodyDTO(req.body);

    const created = await this.sendFriendRequestUC.execute({ userId, toUserId: dto.toUserId });

    this.sendResponse<FriendRequestResponseDTO>({
      res,
      instance: Created,
      data: new FriendRequestResponseDTO(created),
      message: 'Friend request sent successfully'
    });
  }

  @AutoBind()
  async acceptIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;

    await this.acceptIncomingRequestUC.execute({ userId, fromUserId });

    this.sendResponse({ res, message: 'Friend request accepted successfully' });
  }

  @AutoBind()
  async declineIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;

    await this.declineIncomingRequestUC.execute({ userId, fromUserId });

    this.sendResponse({ res, message: 'Friend request declined successfully' });
  }

  @AutoBind()
  async revokeOutgoingRequest(req: Request<RevokeOutgoingRequestParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { toUserId } = req.params;

    await this.revokeOutgoingRequestUC.execute({ userId, toUserId });

    this.sendResponse({ res, message: 'Friend request revoked successfully' });
  }

  @AutoBind()
  async unfriend(req: Request<UnfriendParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { userId: otherUserId } = req.params;

    await this.unfriendUC.execute({ userId, otherUserId });

    this.sendResponse({ res, message: 'Unfriend successfully' });
  }
}
